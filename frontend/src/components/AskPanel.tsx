import { useState } from "react";
import ReactMarkdown from "react-markdown";

import type { AskResponse } from "../api/client";
import { SourceList } from "./SourceList";

const sampleQuestions = [
  "Which file looks like the main entry point?",
  "Where is API routing defined?",
  "How are the main modules connected?",
  "Where is configuration initialized?"
];

type AskPanelProps = {
  response: AskResponse | null;
  loading: boolean;
  disabled: boolean;
  disabledReason: string | null;
  statusMessage: string | null;
  error: string | null;
  onAsk: (question: string) => void;
};

export function AskPanel({
  response,
  loading,
  disabled,
  disabledReason,
  statusMessage,
  error,
  onAsk
}: AskPanelProps) {
  const [question, setQuestion] = useState("");
  const visibleChunks = response?.retrieved_chunks.slice(0, 6) ?? [];

  const submit = () => {
    const nextQuestion = question.trim();
    if (!nextQuestion || disabled || loading) {
      return;
    }
    onAsk(nextQuestion);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Left side: Chat and Input */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Input Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50/50 shrink-0">
          <div className="relative">
            <textarea
              className="w-full bg-white border border-gray-300 rounded-xl shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-4 pr-32 resize-none min-h-[120px]"
              placeholder={disabled ? disabledReason || "Analyze a repo first" : "How does authentication work?"}
              value={question}
              disabled={disabled}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  submit();
                }
              }}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">⌘+Enter</span>
              <button 
                className="btn-primary py-1.5 px-4 text-sm rounded-lg" 
                disabled={disabled || loading || !question.trim()} 
                onClick={submit} 
                type="button"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Ask"
                )}
              </button>
            </div>
          </div>
          
          {error && <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{error}</div>}
          {statusMessage && !response && !loading && !error && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100">{statusMessage}</div>
          )}

          {!response && !loading && !disabled && (
             <div className="mt-4 flex flex-wrap gap-2">
               {sampleQuestions.map((item) => (
                 <button 
                   key={item} 
                   className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors" 
                   onClick={() => {
                     setQuestion(item);
                   }} 
                   type="button"
                 >
                   {item}
                 </button>
               ))}
             </div>
          )}
        </div>

        {/* Answer Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div className="text-gray-500 font-medium">Searching indexed files...</div>
            </div>
          ) : response ? (
            <div className="prose max-w-none">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">Response</span>
                <span className="text-xs font-mono text-gray-500">{response.repo_name}</span>
              </div>
              <ReactMarkdown>{response.answer}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Ask a question to receive a grounded answer with explicit source files and chunks.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Evidence Rail */}
      <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0 overflow-y-auto h-full">
        {response ? (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Referenced Sources</h3>
              <SourceList sources={response.sources} />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex-1 flex flex-col overflow-hidden">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 shrink-0">Retrieved Context</h3>
              <ul className="space-y-4 overflow-y-auto flex-1 pr-2">
                {visibleChunks.map((chunk) => (
                  <li key={`${chunk.file_path}-${chunk.chunk_index}`} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-baseline gap-2 mb-2 border-b border-gray-200 pb-2">
                      <strong className="text-sm text-gray-900 truncate font-mono">{chunk.file_path}</strong>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">chunk {chunk.chunk_index}</span>
                    </div>
                    {chunk.symbol_names.length ? (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {chunk.symbol_names.map((sym) => (
                          <span key={sym} className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {sym}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="text-xs text-gray-600 font-mono leading-relaxed line-clamp-6">{chunk.preview}</p>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 font-medium">
            Sources and context chunks will appear here after you ask a question.
          </div>
        )}
      </div>
    </div>
  );
}
