import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import LogoutButton from "@/components/LogoutButton";

interface Span {
  start: number;
  end: number;
  category: string;
  text?: string;
}

interface RagChunk {
  content?: string;
  text?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("auth_token");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [spans, setSpans] = useState<Span[]>([]);
  const [ragContext, setRagContext] = useState<RagChunk[]>([]);
  const [redactedPrompt, setRedactedPrompt] = useState("");
  const [error, setError] = useState("");

  if (!token) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResponse(data.response ?? "");
      setSpans(data.spans ?? []);
      setRagContext(data.rag_context ?? []);
      setRedactedPrompt(data.redacted_prompt ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">ClinGuard Dashboard</h1>
          <LogoutButton onLogout={() => { localStorage.removeItem("auth_token"); navigate("/"); }} />
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Clinical prompt (PHI is detected and redacted before AI)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              placeholder="Enter clinical note or question..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full"
            />
            <Button onClick={handleSend} disabled={loading}>
              {loading ? "Sending…" : "Send"}
            </Button>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </CardContent>
        </Card>

        {redactedPrompt && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Redacted prompt sent to AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{redactedPrompt}</p>
            </CardContent>
          </Card>
        )}

        {response && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>AI response</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{response}</p>
            </CardContent>
          </Card>
        )}

        {spans.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Detected PHI ({spans.length} spans)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground list-disc pl-4">
                {spans.map((s, i) => (
                  <li key={i}>{s.category}: {s.text ?? prompt.slice(s.start, s.end)}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {ragContext.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">RAG clinical context</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {ragContext.map((r, i) => (
                  <li key={i} className="border-l-2 pl-2 border-primary/30">
                    {r.content ?? r.text}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
