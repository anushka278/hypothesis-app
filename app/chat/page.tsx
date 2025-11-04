'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage, Hypothesis, Variable, ParsedHypothesis, KnowledgeCard as KnowledgeCardType, Conversation } from '@/lib/types';
import { saveHypothesis, getActiveHypotheses, saveConversation, getConversations } from '@/lib/storage';
import { parseHypothesis, generateKnowledgeCard, generateClarifyingQuestions } from '@/lib/nlp-parser';
import { parseHypothesisWithAI, generateKnowledgeCardWithAI, generateClarifyingQuestionsWithAI } from '@/lib/openai-service';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatInput from '@/components/chat/ChatInput';
import KnowledgeCard from '@/components/chat/KnowledgeCard';
import ConversationHistoryPanel from '@/components/chat/ConversationHistoryPanel';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';
import { History } from 'lucide-react';

type ConversationStep = 
  | 'welcome' 
  | 'parsing' 
  | 'show_knowledge' 
  | 'clarify_outcome'
  | 'clarify_frequency'
  | 'clarify_timing'
  | 'suggest_baseline'
  | 'suggest_controls'
  | 'confirm'
  | 'complete';

interface ConversationState {
  hypothesisText: string;
  parsed?: ParsedHypothesis;
  knowledgeCard?: KnowledgeCardType;
  outcomeContext?: string;
  frequency?: string;
  timing?: string;
  wantsBaseline: boolean;
  baselineDays: number;
  selectedControls: string[];
  suggestedControls: string[];
  currentQuestionIndex: number;
  clarifyingQuestions: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<ConversationStep>('welcome');
  const [isProcessing, setIsProcessing] = useState(false);
  const [knowledgeCardAfterMessageId, setKnowledgeCardAfterMessageId] = useState<string | null>(null);
  const [state, setState] = useState<ConversationState>({
    hypothesisText: '',
    wantsBaseline: false,
    baselineDays: 7,
    selectedControls: [],
    suggestedControls: [],
    currentQuestionIndex: 0,
    clarifyingQuestions: [],
  });
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Example hypotheses for suggestion buttons
  const exampleHypotheses = [
    "I want to see if taking omega-3 improves my focus",
    "Does meditation help reduce my stress?",
    "Will morning exercise boost my energy?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, knowledgeCardAfterMessageId]);

  useEffect(() => {
    setConversations(getConversations());
  }, []);

  // Load conversation from query param if provided
  useEffect(() => {
    const conversationId = searchParams.get('conversationId');
    if (conversationId) {
      const allConversations = getConversations();
      const conversation = allConversations.find(c => c.id === conversationId);
      if (conversation) {
        loadConversation(conversation);
        // Clear the query param after loading
        router.replace('/chat');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  // Set welcome message on initial mount (only if no conversationId in URL)
  useEffect(() => {
    const conversationId = searchParams.get('conversationId');
    if (!conversationId && messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "What's on your mind? Let's design a personal experiment and put your hypothesis to the test.",
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Save conversation when messages or state change
  useEffect(() => {
    if (isLoadingConversation) return; // Don't save while loading a conversation
    
    if (messages.length > 1) { // Only save if there's more than just the welcome message
      const conversationId = currentConversationId || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
      }

      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage?.content.substring(0, 50) || state.hypothesisText.substring(0, 50) || 'New Conversation';

      const existingConversations = getConversations();
      const existingConversation = existingConversations.find(c => c.id === conversationId);

      const conversation: Conversation = {
        id: conversationId,
        title: title.length < 50 ? title : title + '...',
        messages,
        state: {
          hypothesisText: state.hypothesisText,
          parsed: state.parsed,
          knowledgeCard: state.knowledgeCard,
          outcomeContext: state.outcomeContext,
          frequency: state.frequency,
          timing: state.timing,
          wantsBaseline: state.wantsBaseline,
          baselineDays: state.baselineDays,
          selectedControls: state.selectedControls,
          suggestedControls: state.suggestedControls,
          currentQuestionIndex: state.currentQuestionIndex,
          clarifyingQuestions: state.clarifyingQuestions,
          step: step,
          knowledgeCardAfterMessageId: knowledgeCardAfterMessageId,
        },
        createdAt: existingConversation?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveConversation(conversation);
      setConversations(getConversations());
    }
  }, [messages, state, step, knowledgeCardAfterMessageId, currentConversationId, isLoadingConversation]);

  const addMessage = (content: string, role: 'assistant' | 'user'): string => {
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const msg: ChatMessage = {
      id: msgId,
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    return msgId;
  };

  const handleUserMessage = async (content: string) => {
    addMessage(content, 'user');
    setIsProcessing(true);

    // Use setTimeout for non-AI steps, but await for AI steps
    if (step === 'welcome') {
      await processStep(content);
      setIsProcessing(false);
    } else {
      setTimeout(() => {
        processStep(content);
        setIsProcessing(false);
      }, 800);
    }
  };

  const processStep = async (userInput: string) => {
    const lower = userInput.toLowerCase();

    switch (step) {
      case 'welcome':
        // Show loading message
        addMessage("🤔 Analyzing your hypothesis...", 'assistant');
        
        // Check if OpenAI API key is available
        const useAI = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your-api-key-here';
        
        try {
          // Parse the hypothesis using AI or fallback to hardcoded
          const parsed = useAI 
            ? await parseHypothesisWithAI(userInput)
            : parseHypothesis(userInput);
          
          const knowledgeCard = useAI
            ? await generateKnowledgeCardWithAI(parsed.intervention, parsed.outcome, parsed.category)
            : generateKnowledgeCard(parsed.intervention, parsed.outcome, parsed.category);
          
          const questions = useAI
            ? await generateClarifyingQuestionsWithAI(parsed)
            : generateClarifyingQuestions(parsed);
          
          setState(prev => ({
            ...prev,
            hypothesisText: userInput,
            parsed,
            knowledgeCard,
            clarifyingQuestions: questions,
            suggestedControls: knowledgeCard.relatedControls,
          }));

          const analysisMsg = `✨ Great! I've analyzed your hypothesis:\n\n**Intervention:** ${parsed.intervention}\n**Outcome:** ${parsed.outcome}\n**Category:** ${parsed.category}\n\nLet me show you some helpful context about this...`;
          const analysisMsgId = addMessage(analysisMsg, 'assistant');
          
          // Set knowledge card to appear after the analysis message
          setKnowledgeCardAfterMessageId(analysisMsgId);
          setStep('show_knowledge');
          
          // Auto-advance after showing knowledge
          setTimeout(() => {
            addMessage(
              "Now, let me ask a few questions to refine your experiment setup...",
              'assistant'
            );
            setTimeout(() => {
              if (questions.length > 0) {
                addMessage(questions[0], 'assistant');
                setStep('clarify_outcome');
              }
            }, 1000);
          }, 2000);
        } catch (error) {
          console.error('Error processing hypothesis:', error);
          addMessage(
            "I encountered an error analyzing your hypothesis. Please try rephrasing it or check your API configuration.",
            'assistant'
          );
        }
        break;

      case 'clarify_outcome':
        setState(prev => ({ ...prev, outcomeContext: userInput }));
        
        if (state.clarifyingQuestions.length > 1) {
          addMessage(
            "Got it! " + state.clarifyingQuestions[1],
            'assistant'
          );
          setStep('clarify_frequency');
        } else {
          proceedToBaselineSuggestion();
        }
        break;

      case 'clarify_frequency':
        setState(prev => ({ ...prev, frequency: userInput }));
        
        if (state.clarifyingQuestions.length > 2) {
          addMessage(
            state.clarifyingQuestions[2],
            'assistant'
          );
          setStep('clarify_timing');
        } else {
          proceedToBaselineSuggestion();
        }
        break;

      case 'clarify_timing':
        setState(prev => ({ ...prev, timing: userInput }));
        proceedToBaselineSuggestion();
        break;

      case 'suggest_baseline':
        if (lower.includes('yes') || lower.includes('sure') || lower.includes('ok')) {
          setState(prev => ({ ...prev, wantsBaseline: true }));
          addMessage(
            `Perfect! I recommend tracking a **7-day baseline period** before starting ${state.parsed?.intervention}. This helps us compare "before" vs "after".\n\nDuring baseline, you'll track the outcome (${state.parsed?.outcome}) without the intervention.\n\nSound good?`,
            'assistant'
          );
          
          setTimeout(() => {
            proceedToControlSuggestion();
          }, 2000);
        } else {
          setState(prev => ({ ...prev, wantsBaseline: false }));
          addMessage(
            "No problem! We'll skip the baseline and start tracking immediately.",
            'assistant'
          );
          setTimeout(() => {
            proceedToControlSuggestion();
          }, 1500);
        }
        break;

      case 'suggest_controls':
        // Parse which controls they want
        const selectedControls: string[] = [];
        state.suggestedControls.forEach(control => {
          if (lower.includes(control.toLowerCase()) || lower.includes('all')) {
            selectedControls.push(control);
          }
        });
        
        if (selectedControls.length === 0 && (lower.includes('yes') || lower.includes('sure'))) {
          // They said yes but didn't specify - add all
          selectedControls.push(...state.suggestedControls.slice(0, 3));
        }
        
        if (lower.includes('no') || lower.includes('skip')) {
          // They don't want controls
          setState(prev => ({ ...prev, selectedControls: [] }));
        } else {
          setState(prev => ({ ...prev, selectedControls }));
        }
        
        proceedToConfirmation();
        break;

      case 'confirm':
        if (lower.includes('yes') || lower.includes('perfect') || lower.includes('good') || lower.includes('correct')) {
          createAndSaveHypothesis();
        } else {
          addMessage(
            "No problem! Let's start over. What hypothesis would you like to test?",
            'assistant'
          );
          setStep('welcome');
          setState({
            hypothesisText: '',
            wantsBaseline: false,
            baselineDays: 7,
            selectedControls: [],
            suggestedControls: [],
            currentQuestionIndex: 0,
            clarifyingQuestions: [],
          });
          setKnowledgeCardAfterMessageId(null);
        }
        break;
    }
  };

  const proceedToBaselineSuggestion = () => {
    addMessage(
      `📊 **Baseline Tracking Phase**\n\nI recommend tracking a baseline period (3-7 days) *before* you start ${state.parsed?.intervention}. This gives us a comparison point.\n\nWould you like to include a baseline phase?`,
      'assistant'
    );
    setStep('suggest_baseline');
  };

  const proceedToControlSuggestion = () => {
    const controlList = state.suggestedControls.map((c, i) => `${i + 1}. ${c}`).join('\n');
    
    addMessage(
      `🎯 **Control Variables**\n\nTo get meaningful insights, I recommend also tracking these factors that might influence your ${state.parsed?.outcome}:\n\n${controlList}\n\nWould you like to track these? (You can say "all", pick specific ones, or "no thanks")`,
      'assistant'
    );
    setStep('suggest_controls');
  };

  const proceedToConfirmation = () => {
    const baselineText = state.wantsBaseline 
      ? `✓ 7-day baseline phase\n` 
      : '✗ No baseline\n';
    
    const controlsText = state.selectedControls.length > 0
      ? `✓ Tracking controls: ${state.selectedControls.join(', ')}\n`
      : '✗ No control variables\n';
    
    const frequencyText = state.frequency ? `✓ Frequency: ${state.frequency}\n` : '';
    const timingText = state.timing ? `✓ Timing: ${state.timing}\n` : '';
    
    addMessage(
      `🎉 **Experiment Summary**\n\n**Hypothesis:** ${state.hypothesisText}\n\n**Intervention:** ${state.parsed?.intervention}\n**Outcome:** ${state.parsed?.outcome}\n\n${baselineText}${controlsText}${frequencyText}${timingText}\nReady to start? Type "yes" to create your experiment!`,
      'assistant'
    );
    setStep('confirm');
  };

  const loadConversation = (conversation: Conversation) => {
    setIsLoadingConversation(true);
    setMessages(conversation.messages);
    setState({
      hypothesisText: conversation.state.hypothesisText,
      parsed: conversation.state.parsed,
      knowledgeCard: conversation.state.knowledgeCard,
      outcomeContext: conversation.state.outcomeContext,
      frequency: conversation.state.frequency,
      timing: conversation.state.timing,
      wantsBaseline: conversation.state.wantsBaseline,
      baselineDays: conversation.state.baselineDays,
      selectedControls: conversation.state.selectedControls,
      suggestedControls: conversation.state.suggestedControls,
      currentQuestionIndex: conversation.state.currentQuestionIndex,
      clarifyingQuestions: conversation.state.clarifyingQuestions,
    });
    setStep(conversation.state.step as ConversationStep);
    setKnowledgeCardAfterMessageId(conversation.state.knowledgeCardAfterMessageId || null);
    setCurrentConversationId(conversation.id);
    // Allow saving after a brief delay
    setTimeout(() => setIsLoadingConversation(false), 100);
  };

  const startNewConversation = () => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "What's on your mind? Let's design a personal experiment and put your hypothesis to the test.",
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
    setStep('welcome');
    setState({
      hypothesisText: '',
      wantsBaseline: false,
      baselineDays: 7,
      selectedControls: [],
      suggestedControls: [],
      currentQuestionIndex: 0,
      clarifyingQuestions: [],
    });
    setKnowledgeCardAfterMessageId(null);
    setCurrentConversationId(null);
  };

  const createAndSaveHypothesis = () => {
    if (!state.parsed) return;

    const colors = ['#6CC5A1', '#F57C6E', '#A8D5E2', '#C5B9E0', '#B8D4C8'];
    const hypothesisId = `hyp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const variables: Variable[] = [];
    
    // Main outcome variable
    const outcomeName = state.parsed.outcome
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    variables.push({
      id: `var-${Date.now()}-0-${Math.random().toString(36).substr(2, 9)}`,
      name: outcomeName,
      type: 'scale',
      color: colors[0],
      hypothesisId,
      isControl: false,
      promptTime: state.timing?.toLowerCase().includes('morning') ? 'morning' : 
                  state.timing?.toLowerCase().includes('evening') ? 'evening' : 'anytime',
    });
    
    // Intervention variable (if trackable)
    if (!state.wantsBaseline || state.parsed.intervention.toLowerCase().includes('exercise') || 
        state.parsed.intervention.toLowerCase().includes('meditation')) {
      const interventionName = state.parsed.intervention
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      variables.push({
        id: `var-${Date.now()}-1-${Math.random().toString(36).substr(2, 9)}`,
        name: interventionName,
        type: 'binary',
        color: colors[1],
        hypothesisId,
        isControl: false,
        promptTime: 'anytime',
      });
    }
    
    // Control variables
    state.selectedControls.forEach((control, idx) => {
      const controlLower = control.toLowerCase();
      let varName = control
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      let varType: 'scale' | 'binary' | 'numeric' = 'scale';
      
      // Handle sleep - rename to "Sleep" and keep as scale
      if (controlLower.includes('sleep')) {
        varName = 'Sleep';
        varType = 'scale';
      }
      // Handle stress - make it scale
      else if (controlLower.includes('stress')) {
        varType = 'scale';
      }
      // Handle nutrition - make it scale (we'll use special input component)
      else if (controlLower.includes('nutrition') || controlLower.includes('diet') || controlLower.includes('meal')) {
        varType = 'scale';
      }
      // Binary only for: medication, alcohol, smoking, symptoms
      else if (
        controlLower.includes('medication') || 
        controlLower.includes('alcohol') || 
        controlLower.includes('smoking') || 
        controlLower.includes('smoke') ||
        controlLower.includes('headache') ||
        controlLower.includes('fever') ||
        controlLower.includes('nausea') ||
        controlLower.includes('symptom')
      ) {
        varType = 'binary';
      }
      // Scale for quality, level, mood, energy
      else if (controlLower.includes('quality') || controlLower.includes('level') || controlLower.includes('mood') || controlLower.includes('energy')) {
        varType = 'scale';
      }
      // Numeric for intake, glasses, hours
      else if (controlLower.includes('intake') || controlLower.includes('glasses') || controlLower.includes('hours')) {
        varType = 'numeric';
      }
      // Default to scale for most things
      else {
        varType = 'scale';
      }
      
      variables.push({
        id: `var-${Date.now()}-${idx + 2}-${Math.random().toString(36).substr(2, 9)}`,
        name: varName,
        type: varType,
        color: colors[(idx + 2) % colors.length],
        hypothesisId,
        isControl: true,
        promptTime: controlLower.includes('sleep') ? 'evening' : 'anytime',
      });
    });
    
    const hypothesis: Hypothesis = {
      id: hypothesisId,
      question: state.hypothesisText,
      variables,
      createdAt: new Date().toISOString(),
      archived: false,
      parsed: state.parsed,
      knowledgeCard: state.knowledgeCard,
      baselinePhase: state.wantsBaseline ? {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + state.baselineDays * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
      } : undefined,
      interventionStartDate: state.wantsBaseline ? 
        new Date(Date.now() + state.baselineDays * 24 * 60 * 60 * 1000).toISOString() : 
        new Date().toISOString(),
      context: {
        frequency: state.frequency,
        timing: state.timing,
        specificContext: state.outcomeContext,
      },
      conversationId: currentConversationId || undefined,
    };
    
    saveHypothesis(hypothesis);
    
    addMessage(
      `✨ **Experiment Created!**\n\nYour hypothesis is now live. Head to the **Track** tab to start logging data.\n\n${state.wantsBaseline ? `⏰ Remember: Track baseline for 7 days before starting ${state.parsed.intervention}!` : '🚀 Start tracking immediately!'}\n\nGood luck with your experiment! 🎯`,
      'assistant'
    );
    setStep('complete');
    
    setTimeout(() => {
      router.push('/dashboard');
    }, 3000);
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <AppHeader />
      </div>

      {/* History Button */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="absolute left-4 top-16 z-30 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="Conversation History"
      >
        <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* History Panel */}
      {showHistory && (
        <ConversationHistoryPanel
          conversations={conversations}
          onSelectConversation={loadConversation}
          onClose={() => setShowHistory(false)}
        />
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {messages.map((msg, index) => (
            <div key={msg.id}>
              <ChatBubble message={msg} delay={index * 0.1} />
              
              {/* Show suggestion buttons after welcome message */}
              {msg.id === 'welcome' && step === 'welcome' && (
                <div className="mb-4 space-y-2">
                  {exampleHypotheses.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUserMessage(example)}
                      disabled={isProcessing}
                      className="w-full text-left px-4 py-3 bg-white border-2 border-[var(--accent)]/30 rounded-xl hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-[var(--accent)] font-medium">💡</span> {example}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Show knowledge card after the analysis message */}
              {msg.id === knowledgeCardAfterMessageId && state.knowledgeCard && (
                <KnowledgeCard knowledgeCard={state.knowledgeCard} />
              )}
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <ChatInput
            onSend={handleUserMessage}
            disabled={isProcessing || step === 'complete'}
            placeholder={isProcessing ? 'Processing...' : 'Type your message...'}
          />
          {step === 'welcome' && getActiveHypotheses().length > 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              💡 You have active experiments. Create another or go to Track.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
