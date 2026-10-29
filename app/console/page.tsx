"use client";
import { useMemo, useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { ThreadStatus } from "@/lib/types";
const labels: Record<ThreadStatus, string> = {
  ai: "AI応答中",
  waiting: "未対応",
  staff: "対応中",
  done: "完了",
};
export function ConsoleChat() {
  const { state, update, sendStaff } = useDemo();
  const [tab, setTab] = useState<"all" | "waiting" | "staff" | "done">("all");
  const available = state.threads
    .filter((t) => t.facilityId === state.activeFacilityId)
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  const filtered =
    tab === "all" ? available : available.filter((t) => t.status === tab);
  const [selected, setSelected] = useState(available[0]?.id || "");
  const thread = available.find((t) => t.id === selected) || filtered[0];
  const [reply, setReply] = useState("");
  const [outreach, setOutreach] = useState(false);
  const counts = useMemo(
    () => ({
      waiting: available.filter((t) => t.status === "waiting").length,
      staff: available.filter((t) => t.status === "staff").length,
      done: available.filter((t) => t.status === "done").length,
    }),
    [available],
  );
  const mutate = (fn: (t: any) => void) =>
    update((s) => {
      const t = s.threads.find((x) => x.id === thread?.id);
      if (t) fn(t);
      return s;
    });
  const statusLabel = (target: typeof thread) =>
    target?.emergency && target.status === "waiting"
      ? "緊急受付"
      : target?.afterHours && target.status === "waiting"
        ? "時間外受付"
        : target?.status === "ai"
          ? "AI"
          : target
            ? labels[target.status]
            : "";
  return (
    <div className="chat-workspace">
      <section className="thread-panel">
        <div className="panel-title">
          <div>
            <h1>チャット</h1>
            <span>{available.length}件のトーク</span>
          </div>
          <button className="outreach" onClick={() => setOutreach(true)}>
            ＋ 声掛け
          </button>
        </div>
        <div className="thread-tabs">
          {(["all", "waiting", "staff", "done"] as const).map((x) => (
            <button
              key={x}
              className={tab === x ? "active" : ""}
              onClick={() => setTab(x)}
            >
              {x === "all"
                ? "すべて"
                : x === "waiting"
                  ? "未対応"
                  : x === "staff"
                    ? "対応中"
                    : "完了"}
              {x !== "all" && <b>{counts[x]}</b>}
            </button>
          ))}
        </div>
        <div className="thread-list">
          {filtered.map((t) => {
            const last = t.messages.at(-1);
            return (
              <button
                key={t.id}
                className={thread?.id === t.id ? "active" : ""}
                onClick={() => setSelected(t.id)}
              >
                <div className="room-avatar">{t.roomNumber}</div>
                <div className="thread-copy">
                  <div>
                    <b>
                      {t.roomNumber}号室 {t.guestName}
                    </b>
                    <time>
                      {Math.max(
                        1,
                        Math.round((Date.now() - t.lastMessageAt) / 60000),
                      )}
                      分前
                    </time>
                  </div>
                  <p>{last?.text}</p>
                  <small>
                    {t.guests}名・{t.nights}泊
                  </small>
                  <span
                    className={`status ${t.emergency ? "emergency" : t.afterHours ? "after-hours" : t.status}`}
                  >
                    {statusLabel(t)}
                  </span>
                  {t.assignee && <span className="assignee">{t.assignee}</span>}
                </div>
                {t.unreadByStaff > 0 && <i>{t.unreadByStaff}</i>}
              </button>
            );
          })}
        </div>
      </section>
      {thread ? (
        <section className="conversation">
          <header>
            <div>
              <div className="room-avatar">{thread.roomNumber}</div>
              <div>
                <h2>
                  {thread.roomNumber}号室 {thread.guestName}
                </h2>
                <p>
                  {thread.guests}名・{thread.nights}泊{" "}
                  <span
                    className={`status ${thread.emergency ? "emergency" : thread.afterHours ? "after-hours" : thread.status}`}
                  >
                    {statusLabel(thread)}
                  </span>
                  {thread.afterHours && thread.nextStaffResponse ? (
                    <small className="next-response">
                      {thread.nextStaffResponse}に確認予定
                    </small>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="conversation-actions">
              {thread.status !== "staff" && (
                <button
                  className="primary small"
                  onClick={() =>
                    mutate((t) => {
                      t.status = "staff";
                      t.assignee = state.currentStaff;
                      t.unreadByStaff = 0;
                      t.afterHours = false;
                      t.nextStaffResponse = undefined;
                    })
                  }
                >
                  対応を引き取る
                </button>
              )}
              <button
                onClick={() =>
                  mutate((t) => {
                    t.status = "ai";
                    t.assignee = "";
                    t.afterHours = false;
                    t.emergency = false;
                    t.nextStaffResponse = undefined;
                  })
                }
              >
                AIに戻す
              </button>
              <button
                onClick={() =>
                  mutate((t) => {
                    t.status = "done";
                    t.afterHours = false;
                    t.emergency = false;
                    t.nextStaffResponse = undefined;
                  })
                }
              >
                完了
              </button>
            </div>
          </header>
          <div className="handover">
            <b>引継ぎメモ</b>
            <input
              value={thread.handoverNote}
              onChange={(e) => mutate((t) => (t.handoverNote = e.target.value))}
              placeholder="スタッフだけに見えるメモを入力"
            />
            <span>自動保存</span>
          </div>
          <div className="console-messages">
            {thread.messages.map((m) => (
              <div key={m.id} className={`console-bubble ${m.from}`}>
                <div>
                  <small>
                    {m.from === "guest"
                      ? `${thread.roomNumber}号室`
                      : m.from === "ai"
                        ? "AIコンシェルジュ"
                        : m.from === "facility"
                          ? "施設から"
                          : `${m.staffName}（スタッフ）`}
                  </small>
                  <p>{m.text}</p>
                  <time>
                    {new Date(m.createdAt).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </div>
            ))}
          </div>
          <div className="template-row">
            <button
              onClick={() =>
                setReply("かしこまりました。確認してご連絡いたします。")
              }
            >
              確認します
            </button>
            <button
              onClick={() =>
                setReply("お待たせいたしました。ただいまお持ちします。")
              }
            >
              お持ちします
            </button>
            <button onClick={() => setReply("ご連絡ありがとうございます。")}>
              お礼
            </button>
          </div>
          <form
            className="console-reply"
            onSubmit={(e) => {
              e.preventDefault();
              if (!reply.trim()) return;
              sendStaff(thread.id, reply);
              setReply("");
            }}
          >
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="メッセージを入力してください"
            />
            <button>送信</button>
          </form>
        </section>
      ) : (
        <div className="empty">トークを選択してください</div>
      )}
      {outreach && <Outreach onClose={() => setOutreach(false)} />}
    </div>
  );
}
function Outreach({ onClose }: { onClose: () => void }) {
  const { state, sendStaff } = useDemo();
  const f = state.facilities.find((x) => x.id === state.activeFacilityId)!;
  const [room, setRoom] = useState(f.rooms[0]);
  const [text, setText] = useState("お迎えに伺います");
  return (
    <div className="modal-bg">
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <p className="eyebrow">PROACTIVE MESSAGE</p>
        <h2>客室へ声掛け</h2>
        <label>
          送信先の客室
          <select value={room} onChange={(e) => setRoom(e.target.value)}>
            {f.rooms.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          メッセージ
          <textarea value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div className="chips">
          {[
            "お迎えに伺います",
            "お食事後のお飲み物はいかがでしょうか",
            "お部屋の準備が整いました",
          ].map((x) => (
            <button key={x} onClick={() => setText(x)}>
              {x}
            </button>
          ))}
        </div>
        <button
          className="button primary wide"
          onClick={() => {
            sendStaff(`${f.id}-room-${room}`, text, true);
            onClose();
          }}
        >
          この内容で送信
        </button>
      </div>
    </div>
  );
}
export default function ConsolePage() {
  return <ConsoleChat />;
}
