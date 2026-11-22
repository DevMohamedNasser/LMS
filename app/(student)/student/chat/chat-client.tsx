"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import {
  ArrowLeft,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Send,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

type ChatGroup = {
  _id?: string;
  grade: number | string;
  lastMessage?: string;
  lastMessageAt?: string;
};

type ChatMessage = {
  _id: string;
  grade?: number | string;
  content: string;
  createdAt?: string;
  sender?: {
    _id?: string;
    id?: string;
    username?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  senderId?: string | { _id?: string; id?: string };
};

type MessagesEvent = {
  grade?: number | string;
  messages?: ChatMessage[];
  hasMore?: boolean;
};

type ChatClientProps = {
  accessToken: string;
  userId: string;
  userName: string;
};

function getSocketUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (!apiBaseUrl) {
    return undefined;
  }

  // NEXT_PUBLIC_BASE_URL ends with /api/v1/.
  // Socket.IO connects to the server origin, not the REST API path.
  return apiBaseUrl.replace(/\/api\/v1\/?\/?$/, "").replace(/\/+$/, "");
}

function senderIdOf(message: ChatMessage) {
  if (message.sender?._id) return String(message.sender._id);
  if (message.sender?.id) return String(message.sender.id);

  if (typeof message.senderId === "string") {
    return message.senderId;
  }

  if (message.senderId?._id) {
    return String(message.senderId._id);
  }

  if (message.senderId?.id) {
    return String(message.senderId.id);
  }

  return "";
}

function senderNameOf(message: ChatMessage) {
  const sender = message.sender;

  if (sender?.username) return sender.username;
  if (sender?.name) return sender.name;

  const fullName = [sender?.firstName, sender?.lastName]
    .filter(Boolean)
    .join(" ");

  return fullName || "Student";
}

function formatDate(date?: string) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleString();
}

function uniqueMessages(messages: ChatMessage[]) {
  const seen = new Set<string>();

  return messages.filter((message) => {
    const id = String(message._id);

    if (!id || seen.has(id)) return false;

    seen.add(id);
    return true;
  });
}

export function ChatPageSkeleton() {
  return (
    <div className="dark h-dvh overflow-hidden bg-slate-950 p-4 font-sans text-slate-100 md:p-8">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-5">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <Skeleton className="h-10 w-56 bg-slate-800" />
          <Skeleton className="h-10 w-32 rounded-full bg-slate-800" />
        </header>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(120px,0.3fr)_minmax(0,1fr)] gap-4 md:grid-cols-[300px_minmax(0,1fr)] md:grid-rows-1">
          <Card className="flex min-h-0 flex-col overflow-hidden border-slate-800 bg-slate-900">
            <CardHeader>
              <Skeleton className="h-7 w-40 bg-slate-800" />
            </CardHeader>
            <CardContent className="min-h-0 flex-1">
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className="h-16 w-full rounded-xl bg-slate-800"
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="flex min-h-0 flex-col overflow-hidden border-slate-800 bg-slate-900">
            <CardHeader className="border-b border-slate-800">
              <Skeleton className="h-7 w-48 bg-slate-800" />
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-5 p-5">
              <div className="min-h-0 flex-1 space-y-5 overflow-hidden">
                <Skeleton className="h-16 w-2/3 rounded-2xl bg-slate-800" />
                <Skeleton className="ml-auto h-16 w-2/3 rounded-2xl bg-slate-800" />
                <Skeleton className="h-16 w-1/2 rounded-2xl bg-slate-800" />
              </div>
              <Skeleton className="h-12 w-full shrink-0 rounded-xl bg-slate-800" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ChatClient({
  accessToken,
  userId,
  userName,
}: ChatClientProps) {
  const socketRef = useRef<Socket | null>(null);
  const activeGradeRef = useRef<number | null>(null);
  const pendingOlderMessagesRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [connected, setConnected] = useState(false);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGrade, setActiveGrade] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"groups" | "chat">("groups");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [typingName, setTypingName] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  function emitGroups() {
    const socket = socketRef.current;

    if (socket?.connected) {
      setLoadingGroups(true);
      socket.emit("getGroups", {});
    }
  }

  function requestMessages(before?: string) {
    const socket = socketRef.current;

    if (!socket?.connected) return;

    setLoadingMessages(true);
    pendingOlderMessagesRef.current = Boolean(before);

    const payload: { limit: number; before?: string } = {
      limit: 30,
    };

    if (before) {
      payload.before = before;
    }

    // The server determines a student's grade from the access token.
    socket.emit("getMessages", payload);
  }

  useEffect(() => {
    const socket = io(getSocketUrl(), {
      transports: ["polling"],
      extraHeaders: {
        // The Socket.IO API expects USER <token>, not Bearer <token>.
        Authorization: `USER ${accessToken}`,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError("");
      socket.emit("getGroups", {});
    });

    socket.on("connect_error", (socketError: Error) => {
      setConnected(false);
      setLoadingGroups(false);
      setError(socketError.message || "Unable to connect to chat.");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setTypingName("");
    });

    socket.on("groups", (response: ChatGroup[] | { groups?: ChatGroup[] }) => {
      const nextGroups = Array.isArray(response)
        ? response
        : (response?.groups ?? []);

      setGroups(nextGroups);
      setLoadingGroups(false);

      if (activeGradeRef.current === null && nextGroups.length > 0) {
        const firstGrade = Number(nextGroups[0].grade);

        activeGradeRef.current = firstGrade;
        setActiveGrade(firstGrade);
        setMessages([]);
        setLoadingMessages(true);

        const activeSocket = socketRef.current;
        if (activeSocket?.connected) {
          activeSocket.emit("getMessages", { limit: 30 });
        }
      }
    });

    socket.on("messages", (response: MessagesEvent) => {
      const responseGrade =
        response.grade === undefined ? null : Number(response.grade);

      if (
        responseGrade !== null &&
        activeGradeRef.current !== null &&
        responseGrade !== activeGradeRef.current
      ) {
        setLoadingMessages(false);
        return;
      }

      const received = Array.isArray(response.messages)
        ? [...response.messages].reverse()
        : [];

      setHasMore(Boolean(response.hasMore));

      if (pendingOlderMessagesRef.current) {
        setMessages((current) => uniqueMessages([...received, ...current]));
      } else {
        setMessages(uniqueMessages(received));
      }

      pendingOlderMessagesRef.current = false;
      setLoadingMessages(false);
    });

    socket.on("newMessage", (message: ChatMessage) => {
      const messageGrade =
        message.grade === undefined ? null : Number(message.grade);

      if (
        activeGradeRef.current !== null &&
        (messageGrade === null || messageGrade === activeGradeRef.current)
      ) {
        setMessages((current) => uniqueMessages([...current, message]));
      }

      socket.emit("getGroups", {});
    });

    socket.on(
      "typing",
      (data: { grade?: number | string; userId?: string; name?: string }) => {
        if (
          data.grade !== undefined &&
          activeGradeRef.current !== null &&
          Number(data.grade) !== activeGradeRef.current
        ) {
          return;
        }

        if (String(data.userId) === String(userId)) return;

        setTypingName(data.name || "Someone");
      },
    );

    socket.on(
      "stopTyping",
      (data: { grade?: number | string; userId?: string }) => {
        if (
          data.grade !== undefined &&
          activeGradeRef.current !== null &&
          Number(data.grade) !== activeGradeRef.current
        ) {
          return;
        }

        if (String(data.userId) === String(userId)) return;

        setTypingName("");
      },
    );

    socket.on(
      "socketError",
      (data: { event?: string; error?: string } | string) => {
        if (typeof data === "string") {
          setError(data);
        } else {
          setError(
            [data.event, data.error].filter(Boolean).join(": ") ||
              "A chat error occurred.",
          );
        }
      },
    );

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function openConversation(group: ChatGroup) {
    const grade = Number(group.grade);

    activeGradeRef.current = grade;
    setActiveGrade(grade);
    setMessages([]);
    setHasMore(false);
    setTypingName("");
    setError("");
    setMobileView("chat");
    requestMessages();
  }

  function stopTyping() {
    const socket = socketRef.current;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (socket?.connected && isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("stopTyping", {});
    }
  }

  function handleTyping(value: string) {
    setMessageText(value);

    const socket = socketRef.current;

    if (!socket?.connected || activeGradeRef.current === null) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", {});
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("stopTyping", {});
    }, 1200);
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const socket = socketRef.current;
    const content = messageText.trim();

    if (!socket?.connected || activeGradeRef.current === null || !content) {
      return;
    }

    socket.emit("sendMessage", { content });
    setMessageText("");
    stopTyping();
  }

  function refreshHistory() {
    setMessages([]);
    requestMessages();
  }

  function loadOlderMessages() {
    const oldestMessage = messages[0];

    if (!hasMore || !oldestMessage?.createdAt) return;

    requestMessages(oldestMessage.createdAt);
  }

  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="dark h-dvh overflow-hidden bg-slate-950 font-sans text-base text-slate-100">
      <main className="mx-auto flex h-full max-w-7xl flex-col gap-4 overflow-hidden p-4 md:gap-6 md:p-8">
        {/* <header className="flex shrink-0 flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/student"
              aria-label="Back to dashboard"
              className="flex size-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                Student Chats
              </h1>
              <p className="mt-1 text-base text-slate-400">
                Chat with your grade group.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              className={
                connected
                  ? "border border-emerald-800 bg-emerald-950 text-emerald-200"
                  : "border border-slate-700 bg-slate-900 text-slate-300"
              }
            >
              {connected ? (
                <Wifi className="mr-2 size-4" />
              ) : (
                <WifiOff className="mr-2 size-4" />
              )}
              {connected ? "Connected" : "Connecting"}
            </Badge>

            <Button
              type="button"
              variant="outline"
              onClick={emitGroups}
              disabled={!connected || loadingGroups}
              className="h-10 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
            >
              {loadingGroups ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Refresh
            </Button>
          </div>
        </header> */}

        {error && (
          <div
            role="alert"
            className="shrink-0 rounded-xl border border-rose-800 bg-rose-950/50 p-3 text-base text-rose-200"
          >
            {error}
          </div>
        )}

        <section className="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-1 gap-4 overflow-hidden md:grid-cols-[300px_minmax(0,1fr)] md:grid-rows-1">
          <Card
            className={`h-full min-h-0 flex-col overflow-hidden border-slate-800 bg-slate-900 text-slate-100 ${
              mobileView === "chat" ? "hidden md:flex" : "flex"
            }`}
          >
            <CardHeader className="shrink-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <MessageCircle className="size-5 text-indigo-300" />
                Conversations
              </CardTitle>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ScrollArea className="h-full min-h-0 flex-1 pr-3">
                <div className="space-y-3 pb-2">
                  {loadingGroups ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-800 p-4"
                      >
                        <Skeleton className="h-5 w-32 bg-slate-800" />
                        <Skeleton className="mt-3 h-4 w-full bg-slate-800" />
                        <Skeleton className="mt-2 h-4 w-24 bg-slate-800" />
                      </div>
                    ))
                  ) : groups.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center">
                      <MessageCircle className="mx-auto size-8 text-slate-500" />
                      <p className="mt-3 font-medium text-slate-200">
                        No conversations found
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        Your available group chats will appear here.
                      </p>
                    </div>
                  ) : (
                    groups.map((group) => {
                      const grade = Number(group.grade);
                      const active = activeGrade === grade;

                      return (
                        <button
                          type="button"
                          key={group._id ?? group.grade}
                          onClick={() => openConversation(group)}
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            active
                              ? "border-indigo-500 bg-indigo-950/70"
                              : "border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="size-10">
                              <AvatarFallback className="bg-indigo-900 text-indigo-100">
                                {grade}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-100">
                                Grade {grade} Group
                              </p>
                              <p className="mt-1 truncate text-sm text-slate-400">
                                {group.lastMessage || "No messages yet"}
                              </p>
                            </div>
                          </div>

                          {group.lastMessageAt && (
                            <p className="mt-3 text-sm text-slate-500">
                              {formatDate(group.lastMessageAt)}
                            </p>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card
            className={`h-full min-h-0 min-w-0 flex-col overflow-hidden border-slate-800 bg-slate-900 text-slate-100 ${
              mobileView === "groups" ? "hidden md:flex" : "flex"
            }`}
          >
            <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMobileView("groups")}
                  className="size-10 shrink-0 p-0 text-slate-200 hover:bg-slate-800 hover:text-white md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="size-5" />
                </Button>

                <Avatar className="size-10 shrink-0">
                  <AvatarFallback className="bg-indigo-900 text-indigo-100">
                    {activeGrade ?? <MessageCircle className="size-5" />}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <CardTitle className="truncate text-lg text-white">
                    {activeGrade === null
                      ? "Select a conversation"
                      : `Grade ${activeGrade} Group`}
                  </CardTitle>
                  <p className="mt-1 truncate text-sm text-slate-400">
                    {activeGrade === null
                      ? "Choose a group to view its messages"
                      : "Group conversation"}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={refreshHistory}
                disabled={!connected || activeGrade === null || loadingMessages}
                className="h-10 shrink-0 border-slate-700 bg-slate-900 px-3 text-slate-100 hover:bg-slate-800"
              >
                {loadingMessages ? (
                  <LoaderCircle className="size-4 animate-spin sm:mr-2" />
                ) : (
                  <RefreshCw className="size-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Refresh history</span>
              </Button>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              <ScrollArea className="h-full min-h-0 flex-1 px-4 py-5 md:px-6">
                {activeGrade === null ? (
                  <div className="flex min-h-full flex-col items-center justify-center p-6 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-950 text-indigo-300">
                      <MessageCircle className="size-7" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-100">
                      Your conversations
                    </p>
                    <p className="mt-2 max-w-sm text-base text-slate-400">
                      Select a grade group to load its chat history and send a
                      message.
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-full flex-col">
                    {hasMore && messages.length > 0 && (
                      <div className="mb-5 shrink-0 text-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={loadOlderMessages}
                          disabled={loadingMessages}
                          className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
                        >
                          Load older messages
                        </Button>
                      </div>
                    )}

                    {loadingMessages && messages.length === 0 ? (
                      <div className="space-y-5">
                        <Skeleton className="h-16 w-2/3 rounded-2xl bg-slate-800" />
                        <Skeleton className="ml-auto h-16 w-2/3 rounded-2xl bg-slate-800" />
                        <Skeleton className="h-16 w-1/2 rounded-2xl bg-slate-800" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center text-center text-base text-slate-400">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="flex-1 space-y-4">
                        {messages.map((message) => {
                          const mine = senderIdOf(message) === String(userId);

                          return (
                            <div
                              key={message._id}
                              className={`flex ${
                                mine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[85%] sm:max-w-[75%] ${
                                  mine ? "text-right" : "text-left"
                                }`}
                              >
                                <p className="mb-1 px-1 text-sm text-slate-400">
                                  {mine ? "You" : senderNameOf(message)}
                                </p>
                                <div
                                  className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-base leading-relaxed ${
                                    mine
                                      ? "rounded-br-md bg-indigo-600 text-white"
                                      : "rounded-bl-md bg-slate-800 text-slate-100"
                                  }`}
                                >
                                  {message.content}
                                </div>
                                <p className="mt-1 px-1 text-sm text-slate-500">
                                  {formatDate(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <div className="flex h-8 shrink-0 items-center px-5 text-sm text-indigo-300">
                {typingName ? `${typingName} is typing…` : ""}
              </div>

              <form
                onSubmit={sendMessage}
                className="flex shrink-0 gap-3 border-t border-slate-800 p-4 md:p-5"
              >
                <Input
                  value={messageText}
                  onChange={(event) => handleTyping(event.target.value)}
                  onBlur={stopTyping}
                  placeholder={
                    activeGrade === null
                      ? "Select a conversation first"
                      : "Write a message..."
                  }
                  disabled={!connected || activeGrade === null}
                  className="h-12 border-slate-700 bg-slate-950 text-base text-slate-100 placeholder:text-slate-500"
                  autoComplete="off"
                />

                <Button
                  type="submit"
                  disabled={
                    !connected || activeGrade === null || !messageText.trim()
                  }
                  className="h-12 bg-indigo-600 px-4 text-white hover:bg-indigo-500 sm:px-5"
                >
                  <Send className="size-5 sm:mr-2" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
