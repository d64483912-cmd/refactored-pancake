import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAgentTemplate } from '@/hooks/useAgents';
import { SimpleChat } from '@/components/chat/SimpleChat';
import type { AgentQuestion } from '@/types/agent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function formatAnswer(q: AgentQuestion, value: any): string {
  if (q.type === 'multiple') return Array.isArray(value) ? value.join(', ') : String(value ?? '');
  return typeof value === 'string' ? value : String(value ?? '');
}

export default function AgentChatPage() {
  const { agentType } = useParams();
  const { data, isLoading, error } = useAgentTemplate(agentType);
  const template = data?.agent;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [draft, setDraft] = useState<string>('');

  const currentQuestion = useMemo<AgentQuestion | null>(() => {
    if (!template) return null;
    if (currentStep >= template.questions.length) return null;
    return template.questions[currentStep];
  }, [template, currentStep]);

  const messages = useMemo(() => {
    if (!template) return [] as Array<{ id: string; role: 'user' | 'assistant' | 'system'; content: string }>;
    const msgs: Array<{ id: string; role: 'user' | 'assistant' | 'system'; content: string }> = [];
    msgs.push({ id: 'sys-1', role: 'assistant', content: template.initialMessage });
    template.questions.forEach((q, idx) => {
      if (idx < currentStep) {
        msgs.push({ id: `q-${q.id}`, role: 'assistant', content: q.question });
        const ans = answers[q.id];
        msgs.push({ id: `a-${q.id}`, role: 'user', content: formatAnswer(q, ans) });
      }
    });
    if (currentQuestion) {
      msgs.push({ id: `q-${currentQuestion.id}`, role: 'assistant', content: currentQuestion.question });
    } else {
      const summary = buildSummary(template, answers);
      msgs.push({ id: 'done', role: 'assistant', content: summary });
    }
    return msgs;
  }, [template, currentStep, answers, currentQuestion]);

  function handleSubmitAnswer(value: any) {
    if (!currentQuestion) return;
    const next = { ...answers, [currentQuestion.id]: value };
    setAnswers(next);
    setDraft('');
    setCurrentStep((s) => s + 1);
  }

  const chatPlaceholder = currentQuestion?.type === 'text' ? 'Type your answer…' : 'Use the controls below to answer';
  const chatDisabled = currentQuestion?.type !== 'text';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <div className="mb-3 flex items-center gap-3">
          <Link to="/agents" className="text-sm text-muted-foreground hover:underline">← Back to agents</Link>
          {template && <h1 className="text-lg font-semibold tracking-tight">{template.name}</h1>}
        </div>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {error && <div className="text-sm text-red-500">Failed to load agent.</div>}
        {template && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="h-[60vh]">
                <SimpleChat
                  messages={messages}
                  onSend={(text) => handleSubmitAnswer(text)}
                  isLoading={false}
                  title={`${template.name} Setup`}
                  placeholder={chatPlaceholder}
                />
              </div>
            </div>
            {currentQuestion ? (
              <div className="md:col-span-2">
                <QuestionForm
                  question={currentQuestion}
                  value={answers[currentQuestion.id]}
                  onSubmit={handleSubmitAnswer}
                  draft={draft}
                  setDraft={setDraft}
                />
              </div>
            ) : (
              <div className="md:col-span-2">
                <CompletionPanel template={template} answers={answers} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionForm({ question, value, onSubmit, draft, setDraft }: { question: AgentQuestion; value: any; onSubmit: (v: any) => void; draft: string; setDraft: (v: string) => void; }) {
  if (question.type === 'choice') {
    return (
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label className="mb-2 block text-sm">{question.question}</Label>
          <Select onValueChange={(v) => setDraft(v)} value={draft}>
            <SelectTrigger><SelectValue placeholder={question.placeholder || 'Select an option'} /></SelectTrigger>
            <SelectContent>
              {(question.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => draft && onSubmit(draft)} disabled={!draft}>Continue</Button>
      </div>
    );
  }
  if (question.type === 'multiple') {
    const opts = (question.options || []);
    const selected: string[] = Array.isArray(value) ? value : [];
    return (
      <div>
        <Label className="mb-2 block text-sm">{question.question}</Label>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {opts.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label key={opt} className="flex items-center gap-2 rounded-md border p-2">
                <Checkbox checked={checked} onCheckedChange={(c) => {
                  const next = new Set(selected);
                  if (c) next.add(opt); else next.delete(opt);
                  setDraft(Array.from(next).join('\n'));
                }} />
                <span className="text-sm">{opt}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={() => setDraft('')}>Clear</Button>
          <Button onClick={() => onSubmit(draft ? draft.split('\n').filter(Boolean) : [])}>Continue</Button>
        </div>
      </div>
    );
  }
  if (question.type === 'file') {
    return (
      <div>
        <Label className="mb-2 block text-sm">{question.question}</Label>
        <Input type="file" onChange={(e) => onSubmit(e.target.files?.[0] || null)} />
      </div>
    );
  }
  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <Label className="mb-2 block text-sm">{question.question}</Label>
        {question.placeholder && <p className="mb-1 text-xs text-muted-foreground">{question.helperText || question.placeholder}</p>}
        {question.placeholder && question.placeholder.length > 80 ? (
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={question.placeholder} rows={4} />
        ) : (
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={question.placeholder} />
        )}
      </div>
      <Button onClick={() => draft && onSubmit(draft)} disabled={!draft}>Continue</Button>
    </div>
  );
}

function buildSummary(template: { name: string; capabilities: string[]; exampleOutputs: string[] }, answers: Record<string, any>) {
  const lines: string[] = [];
  lines.push(`Great! You've completed the ${template.name} setup questionnaire.`);
  lines.push('');
  lines.push('Your answers:');
  Object.entries(answers).forEach(([k, v]) => {
    const val = Array.isArray(v) ? v.join(', ') : String(v);
    lines.push(`- ${k}: ${val}`);
  });
  lines.push('');
  lines.push('Capabilities to leverage next:');
  template.capabilities.forEach((c) => lines.push(`- ${c}`));
  lines.push('');
  lines.push('Example outputs:');
  template.exampleOutputs.forEach((e) => lines.push(`- ${e}`));
  return lines.join('\n');
}

function CompletionPanel({ template, answers }: { template: any; answers: Record<string, any> }) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-base font-semibold">Setup complete</h2>
      <p className="mt-1 text-sm text-muted-foreground">You can review your answers above. Next, generate automation scripts or start a chat to refine details.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {template.exampleOutputs.map((e: string) => (
          <span key={e} className="rounded-md border px-2 py-1 text-xs text-muted-foreground">{e}</span>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button asChild><Link to="/chat">Open AI Chat</Link></Button>
        <Button variant="secondary" asChild><Link to="/agents">Choose another agent</Link></Button>
      </div>
    </div>
  );
}
