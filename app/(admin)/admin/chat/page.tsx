"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";
import {
  ArrowLeft,
  LoaderCircle,
  MessageCircle,
  Send,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatGroup = {
  id: string;
  grade: number;
  name: string;
  lastMessage?: string;
  lastMessageAt?: string;
};

type ChatMessage = {
  id: string;
  grade: number;
  text: string;
  senderName: string;
  senderId: string;
  createdAt: string;
};

type SocketPayload = unknown;

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

function getSocketUrl(): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not configured.");
  }

  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    throw new Error("NEXT_PUBLIC_BASE_URL is not a valid URL.");
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function payloadArray(payload: SocketPayload): unknown[] {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);

  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.groups)) return record.groups;
  if (Array.isArray(record.messages)) return record.messages;

  return [];
}

function normalizeGroup(value: unknown): ChatGroup | null {
  const record = asRecord(value);
  const grade = Number(record.grade);
  const id = asString(record._id ?? record.id);

  if (!id || !Number.isFinite(grade)) return null;

  return {
    id,
    grade,
    name: `Grade ${grade}`,
    lastMessage: asString(record.lastMessage),
    lastMessageAt: asString(record.lastMessageAt),
  };
}

function normalizeMessage(
  value: unknown,
  fallbackGrade: number,
): ChatMessage | null {
  const record = asRecord(value);
  const sender = asRecord(record.sender ?? record.senderId);
  const content = asString(record.content ?? record.text ?? record.message);

  if (!content) return null;

  const senderId = asString(sender._id ?? sender.id ?? record.senderId);

  const senderName =
    asString(sender.username) ||
    [asString(sender.firstName), asString(sender.lastName)]
      .filter(Boolean)
      .join(" ") ||
    asString(sender.name) ||
    asString(record.senderName, "Unknown");

  return {
    id: asString(
      record._id ?? record.id,
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ),
    grade: Number(record.grade ?? fallbackGrade),
    text: content,
    senderName,
    senderId,
    createdAt: asString(record.createdAt),
  };
}

function sortMessagesOldestFirst(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();

    if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
    if (Number.isNaN(timeA)) return 1;
    if (Number.isNaN(timeB)) return -1;

    return timeA - timeB;
  });
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}

function formatDateTime(value: string): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminChatPage() {
  const { data: session, status: sessionStatus } = useSession();

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const selectedGroupRef = useRef<ChatGroup | null>(null);

  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [connected, setConnected] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [typingName, setTypingName] = useState("");

  const accessToken = session?.accessToken;
  const adminId = session?.user?.id ?? "";

  const socketConfig = useMemo(() => {
    try {
      return { url: getSocketUrl(), error: "" };
    } catch (socketError) {
      return {
        url: "",
        error:
          socketError instanceof Error
            ? socketError.message
            : "Socket URL is invalid.",
      };
    }
  }, []);

  const connectionError =
    error ||
    (sessionStatus === "unauthenticated"
      ? "Please sign in with an admin account."
      : sessionStatus === "authenticated" && !accessToken
        ? "Your admin session does not include an access token."
        : socketConfig.error);

  const visibleMessages = useMemo(() => {
    if (!selectedGroup) return [];

    return sortMessagesOldestFirst(
      messages.filter((message) => message.grade === selectedGroup.grade),
    );
  }, [messages, selectedGroup]);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      return sortMessagesOldestFirst([...current, message]);
    });
  }, []);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    if (
      sessionStatus !== "authenticated" ||
      !accessToken ||
      !socketConfig.url
    ) {
      return;
    }

    const authorization = `ADMIN ${accessToken}`;

    const socket = io(socketConfig.url, {
      transports: ["polling"],
      autoConnect: true,
      auth: {
        authorization,
        token: accessToken,
      },
      extraHeaders: {
        Authorization: authorization,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError("");
      setLoadingGroups(true);
      socket.emit("getGroups", {});
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (socketError: Error) => {
      setConnected(false);
      setLoadingGroups(false);
      setError(socketError.message || "Could not connect to chat.");
    });

    socket.on("socketError", (payload: SocketPayload) => {
      const record = asRecord(payload);
      const event = asString(record.event);
      const message = asString(record.error ?? record.message, "Chat error.");

      setError(event ? `${event}: ${message}` : message);
    });

    socket.on("groups", (payload: SocketPayload) => {
      const incomingGroups = payloadArray(payload)
        .map(normalizeGroup)
        .filter((group): group is ChatGroup => group !== null);

      setGroups(incomingGroups);
      setLoadingGroups(false);
    });

    socket.on("messages", (payload: SocketPayload) => {
      const record = asRecord(payload);
      const activeGroup = selectedGroupRef.current;
      const responseGrade = Number(record.grade);
      const targetGrade = activeGroup?.grade ?? responseGrade;

      if (
        activeGroup &&
        Number.isFinite(responseGrade) &&
        responseGrade !== activeGroup.grade
      ) {
        return;
      }

      const incomingMessages = payloadArray(payload)
        .map((message) => normalizeMessage(message, targetGrade))
        .filter((message): message is ChatMessage => message !== null);

      setMessages((current) => {
        const messagesFromOtherGrades = current.filter(
          (message) => message.grade !== targetGrade,
        );

        return sortMessagesOldestFirst([
          ...messagesFromOtherGrades,
          ...incomingMessages,
        ]);
      });

      setLoadingMessages(false);
    });

    socket.on("newMessage", (payload: SocketPayload) => {
      const activeGroup = selectedGroupRef.current;
      const record = asRecord(payload);
      const messageGrade = Number(record.grade);

      if (!activeGroup || messageGrade !== activeGroup.grade) {
        socket.emit("getGroups", {});
        return;
      }

      const message = normalizeMessage(payload, activeGroup.grade);
      if (message) appendMessage(message);

      socket.emit("getGroups", {});
    });

    socket.on("typing", (payload: SocketPayload) => {
      const record = asRecord(payload);
      const activeGroup = selectedGroupRef.current;

      if (!activeGroup || Number(record.grade) !== activeGroup.grade) return;
      if (String(record.userId) === String(adminId)) return;

      setTypingName(asString(record.name, "Someone"));
    });

    socket.on("stopTyping", (payload: SocketPayload) => {
      const record = asRecord(payload);
      const activeGroup = selectedGroupRef.current;

      if (!activeGroup || Number(record.grade) !== activeGroup.grade) return;
      if (String(record.userId) === String(adminId)) return;

      setTypingName("");
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, sessionStatus, socketConfig.url, adminId, appendMessage]);

  useEffect(() => {
    if (!selectedGroup || !connected) return;

    socketRef.current?.emit("getMessages", {
      grade: Number(selectedGroup.grade),
      limit: 30,
    });
  }, [selectedGroup, connected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages.length]);

  function chooseGroup(group: ChatGroup) {
    setMessages([]);
    setLoadingMessages(true);
    setTypingName("");
    setError("");
    setSelectedGroup(group);
  }

  function handleDraftChange(value: string) {
    setDraft(value);

    if (!selectedGroup) return;

    socketRef.current?.emit("typing", {
      grade: Number(selectedGroup.grade),
    });
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();
    const socket = socketRef.current;

    if (!content || !selectedGroup || !socket?.connected) return;

    socket.emit("sendMessage", {
      grade: Number(selectedGroup.grade),
      content,
    });

    setDraft("");

    socket.emit("stopTyping", {
      grade: Number(selectedGroup.grade),
    });
  }

  if (sessionStatus === "loading") {
    return (
      <div className="flex h-[calc(100dvh-8rem)] items-center justify-center text-slate-400">
        <LoaderCircle className="mr-2 size-5 animate-spin" />
        Loading chat…
      </div>
    );
  }

  return (
    <section className="flex h-[calc(100dvh-8rem)] min-h-[28rem] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4 md:px-6">
        <div>
          <h1 className="font-semibold text-white">Admin Chat</h1>
          <p className="text-sm text-slate-400">
            Student groups and conversations
          </p>
        </div>

        <Badge
          className={
            connected
              ? "border-emerald-800 bg-emerald-950 text-emerald-200"
              : "border-slate-700 bg-slate-900 text-slate-300"
          }
        >
          {connected ? (
            <Wifi className="mr-1 size-3" />
          ) : (
            <WifiOff className="mr-1 size-3" />
          )}
          {connected ? "Connected" : "Disconnected"}
        </Badge>
      </header>

      {connectionError && (
        <div
          role="alert"
          className="mx-4 mt-3 rounded-lg border border-rose-800 bg-rose-950/50 p-3 text-sm text-rose-200"
        >
          {connectionError}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside
          className={`${
            selectedGroup ? "hidden md:flex" : "flex"
          } w-full shrink-0 flex-col border-r border-slate-800 bg-slate-900 md:w-72 lg:w-80`}
        >
          <div className="border-b border-slate-800 p-4">
            <h2 className="font-semibold text-white">Conversations</h2>
            <p className="mt-1 text-sm text-slate-400">
              {groups.length} available
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingGroups && !connectionError ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-lg bg-slate-800"
                  />
                ))}
              </div>
            ) : groups.length > 0 ? (
              groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => chooseGroup(group)}
                  className={`flex w-full items-center gap-3 border-b border-slate-800 px-4 py-3 text-left transition hover:bg-slate-800/70 ${
                    selectedGroup?.id === group.id ? "bg-indigo-950/70" : ""
                  }`}
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-indigo-950 text-indigo-200">
                      {getInitials(group.name)}
                    </AvatarFallback>
                  </Avatar>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-100">
                      {group.name}
                    </span>
                    <span className="mt-1 block truncate text-sm text-slate-400">
                      {group.lastMessage || "No messages yet"}
                    </span>
                    {group.lastMessageAt && (
                      <span className="mt-1 block text-xs text-slate-500">
                        {formatDateTime(group.lastMessageAt)}
                      </span>
                    )}
                  </span>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-slate-400">
                <MessageCircle className="mx-auto mb-3 size-7" />
                {connectionError || "No conversations found."}
              </div>
            )}
          </div>
        </aside>

        <main
          className={`${
            selectedGroup ? "flex" : "hidden md:flex"
          } min-w-0 flex-1 flex-col`}
        >
          {selectedGroup ? (
            <>
              <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-3 md:px-5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedGroup(null)}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="size-5" />
                </Button>

                <Avatar className="size-10">
                  <AvatarFallback className="bg-indigo-950 text-indigo-200">
                    {getInitials(selectedGroup.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-white">
                    {selectedGroup.name}
                  </h2>
                  <p className="truncate text-sm text-slate-400">
                    Group conversation
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
                {loadingMessages ? (
                  <div className="space-y-4">
                    <div className="h-16 w-3/4 animate-pulse rounded-xl bg-slate-900" />
                    <div className="ml-auto h-16 w-2/3 animate-pulse rounded-xl bg-indigo-950" />
                    <div className="h-20 w-3/4 animate-pulse rounded-xl bg-slate-900" />
                  </div>
                ) : visibleMessages.length ? (
                  <div className="space-y-4">
                    {visibleMessages.map((message) => {
                      const isMine =
                        Boolean(adminId) && message.senderId === adminId;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 md:max-w-[70%] ${
                              isMine
                                ? "rounded-br-sm bg-indigo-600 text-white"
                                : "rounded-bl-sm border border-slate-800 bg-slate-900 text-slate-100"
                            }`}
                          >
                            {!isMine && (
                              <p className="mb-1 text-xs font-medium text-indigo-300">
                                {message.senderName}
                              </p>
                            )}

                            <p className="whitespace-pre-wrap wrap-break-words text-sm">
                              {message.text}
                            </p>

                            <p
                              className={`mt-2 text-right text-[11px] ${
                                isMine
                                  ? "text-indigo-100/70"
                                  : "text-slate-500"
                              }`}
                            >
                              {formatDateTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                    <MessageCircle className="mb-3 size-9" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>

              <div className="min-h-6 px-4 text-xs text-indigo-300">
                {typingName ? `${typingName} is typing…` : ""}
              </div>

              <form
                onSubmit={sendMessage}
                className="flex shrink-0 items-end gap-2 border-t border-slate-800 p-3 md:p-4"
              >
                <Textarea
                  value={draft}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Write a message…"
                  rows={1}
                  disabled={!connected}
                  className="max-h-32 min-h-11 resize-y border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                />

                <Button
                  type="submit"
                  size="icon"
                  disabled={!draft.trim() || !connected}
                  className="size-11 shrink-0 bg-indigo-600 text-white hover:bg-indigo-500"
                  aria-label="Send message"
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="hidden flex-1 flex-col items-center justify-center text-center text-slate-400 md:flex">
              <MessageCircle className="mb-4 size-12 text-indigo-300" />
              <h2 className="text-lg font-semibold text-slate-200">
                Select a conversation
              </h2>
              <p className="mt-2 text-sm">
                Choose a group to view its messages.
              </p>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}