'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { ChatMessage, Hypothesis, Variable, ParsedHypothesis, KnowledgeCard as KnowledgeCardType, Conversation } from '@/lib/types';
import { saveHypothesis, getActiveHypotheses, saveConversation, getConversations, archiveHypothesis } from '@/lib/storage';
import { parseHypothesis, generateKnowledgeCard, generateClarifyingQuestions } from '@/lib/nlp-parser';
import { parseHypothesisWithAI, generateKnowledgeCardWithAI, generateClarifyingQuestionsWithAI, chatWithAI } from '@/lib/openai-service';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatInput from '@/components/chat/ChatInput';
import KnowledgeCard from '@/components/chat/KnowledgeCard';
import ConversationHistoryPanel from '@/components/chat/ConversationHistoryPanel';
import ExperimentSummary from '@/components/chat/ExperimentSummary';
import QuestionOptions from '@/components/chat/QuestionOptions';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';
import { History, RefreshCw } from 'lucide-react';

type ConversationStep = 
  | 'chatting'  // Natural conversation mode
  | 'complete';  // Hypothesis created

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

function ChatPageContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<ConversationStep>('chatting');
  const [isProcessing, setIsProcessing] = useState(false);
  const [knowledgeCardAfterMessageId, setKnowledgeCardAfterMessageId] = useState<string | null>(null);
  const [hasShownKnowledgeCard, setHasShownKnowledgeCard] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryMessageId, setSummaryMessageId] = useState<string | null>(null);
  const [messageOptions, setMessageOptions] = useState<Map<string, string[]>>(new Map());
  const [showReplaceConfirmation, setShowReplaceConfirmation] = useState(false);
  const [replaceConfirmationMessageId, setReplaceConfirmationMessageId] = useState<string | null>(null);
  const [shouldFocusInput, setShouldFocusInput] = useState(false);
  const [showKnowledgeCardPrompt, setShowKnowledgeCardPrompt] = useState(false);
  const [knowledgeCardPromptMessageId, setKnowledgeCardPromptMessageId] = useState<string | null>(null);
  const [state, setState] = useState<ConversationState>({
    hypothesisText: '',
    wantsBaseline: true, // Always recommend baseline
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
    // If there's a conversationId in URL, let the other useEffect handle it
    if (conversationId) return;
    
    // Try to load the most recent conversation (persist chat state across tab switches)
    const allConversations = getConversations();
    if (allConversations.length > 0 && messages.length === 0) {
      const mostRecent = allConversations[0];
      // Load if it has actual conversation (more than just welcome) and isn't complete
      if (mostRecent && mostRecent.messages.length > 1 && mostRecent.state.step !== 'complete') {
        loadConversation(mostRecent);
        return;
      }
    }
    
    // If no active conversation exists, show welcome message
    if (messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm here to help you design a personal experiment. What hypothesis would you like to test? For example, you might want to see if taking omega-3 improves your focus, or if meditation reduces your stress.",
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
    if (step === 'complete') return;
    
    // Handle responses to knowledge card prompt (if user types instead of clicking)
    if (showKnowledgeCardPrompt) {
      const lowerContent = content.toLowerCase();
      const wantsCard = lowerContent.includes('yes') || lowerContent.includes('show') || lowerContent.includes('card');
      
      if (wantsCard && state.parsed) {
        // Generate and show knowledge card
        setShowKnowledgeCardPrompt(false);
        addMessage(content, 'user');
        // Show loading message while generating knowledge card
        const loadingMsgId = addMessage("We're pulling that up...", 'assistant');
        
        try {
          const useAI = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your-api-key-here';
          const knowledgeCard = useAI
            ? await generateKnowledgeCardWithAI(state.parsed.intervention, state.parsed.outcome, state.parsed.category)
            : generateKnowledgeCard(state.parsed.intervention, state.parsed.outcome, state.parsed.category);
          
          // Remove loading message
          setMessages(prev => prev.filter(msg => msg.id !== loadingMsgId));
          
          setState(prev => ({
            ...prev,
            knowledgeCard,
            suggestedControls: knowledgeCard.relatedControls,
          }));
          
          setHasShownKnowledgeCard(true);
          // Add the "Great!" message and set the knowledge card to appear after it
          const greatMsgId = addMessage("Great! Here's what the research says about this:", 'assistant');
          setKnowledgeCardAfterMessageId(greatMsgId);
          
          // After showing knowledge card, immediately start asking questions
          setTimeout(async () => {
            // Trigger the AI to ask the first question by simulating a user message
            // that continues the conversation
            setIsProcessing(true);
            try {
              const useAI = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your-api-key-here';
              if (useAI) {
                const openAIMessages = messages
                  .filter(msg => msg.id !== 'welcome' && msg.id !== loadingMsgId)
                  .map(msg => ({
                    role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                    content: msg.content
                  }));
                
                const result = await chatWithAI(openAIMessages, true);
                const options = parseOptionsFromResponse(result.response);
                const responseText = options.length > 0 
                  ? removeOptionsFromResponse(result.response)
                  : result.response;
                
                const assistantMsgId = addMessage(responseText, 'assistant');
                
                if (options.length === 0) {
                  setTimeout(() => setShouldFocusInput(true), 100);
                }
                
                if (options.length > 0) {
                  setMessageOptions(prev => {
                    const newMap = new Map(prev);
                    newMap.set(assistantMsgId, options);
                    return newMap;
                  });
                }
                
                // Update state if extracted info
                if (result.extractedInfo) {
                  const extracted = result.extractedInfo;
                  if (extracted.intervention || extracted.outcome) {
                    const newParsed: ParsedHypothesis = {
                      intervention: extracted.intervention || state.parsed?.intervention || 'intervention',
                      outcome: extracted.outcome || state.parsed?.outcome || 'outcome',
                      category: (extracted.category as ParsedHypothesis['category']) || state.parsed?.category || 'general',
                      confidence: state.parsed?.confidence || 0.9
                    };
                    
                    setState(prev => ({
                      ...prev,
                      parsed: newParsed,
                      frequency: extracted.frequency || prev.frequency,
                      timing: extracted.timing || prev.timing,
                      outcomeContext: extracted.outcomeContext || prev.outcomeContext,
                      wantsBaseline: extracted.wantsBaseline !== undefined ? extracted.wantsBaseline : true,
                      baselineDays: extracted.baselineDays || prev.baselineDays,
                      selectedControls: extracted.selectedControls || prev.selectedControls,
                    }));
                  }
                }
              }
            } catch (error) {
              console.error('Error starting conversation:', error);
            } finally {
              setIsProcessing(false);
              setTimeout(() => setShouldFocusInput(true), 150);
            }
          }, 1500);
          
          setIsProcessing(false);
          return;
        } catch (error) {
          console.error('Error generating knowledge card:', error);
        }
      } else {
        // User said no to knowledge card, immediately start asking questions
        addMessage(content, 'user');
        setShowKnowledgeCardPrompt(false);
        
        setTimeout(async () => {
          setIsProcessing(true);
          try {
            const useAI = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your-api-key-here';
            if (useAI) {
              const openAIMessages = messages
                .filter(msg => msg.id !== 'welcome')
                .map(msg => ({
                  role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                  content: msg.content
                }));
              
              const result = await chatWithAI(openAIMessages, true);
              const options = parseOptionsFromResponse(result.response);
              const responseText = options.length > 0 
                ? removeOptionsFromResponse(result.response)
                : result.response;
              
              const assistantMsgId = addMessage(responseText, 'assistant');
              
              if (options.length === 0) {
                setTimeout(() => setShouldFocusInput(true), 100);
              }
              
              if (options.length > 0) {
                setMessageOptions(prev => {
                  const newMap = new Map(prev);
                  newMap.set(assistantMsgId, options);
                  return newMap;
                });
              }
              
              // Update state if extracted info
              if (result.extractedInfo) {
                const extracted = result.extractedInfo;
                if (extracted.intervention || extracted.outcome) {
                  const newParsed: ParsedHypothesis = {
                    intervention: extracted.intervention || state.parsed?.intervention || 'intervention',
                    outcome: extracted.outcome || state.parsed?.outcome || 'outcome',
                    category: (extracted.category as ParsedHypothesis['category']) || state.parsed?.category || 'general',
                    confidence: state.parsed?.confidence || 0.9
                  };
                  
                  setState(prev => ({
                    ...prev,
                    parsed: newParsed,
                    frequency: extracted.frequency || prev.frequency,
                    timing: extracted.timing || prev.timing,
                    outcomeContext: extracted.outcomeContext || prev.outcomeContext,
                    wantsBaseline: extracted.wantsBaseline !== undefined ? extracted.wantsBaseline : true,
                    baselineDays: extracted.baselineDays || prev.baselineDays,
                    selectedControls: extracted.selectedControls || prev.selectedControls,
                  }));
                }
              }
            }
          } catch (error) {
            console.error('Error starting conversation:', error);
          } finally {
            setIsProcessing(false);
            setTimeout(() => setShouldFocusInput(true), 150);
          }
        }, 500);
        
        setIsProcessing(false);
        return;
      }
    }
    
    // Check if this message was already added (e.g., from clicking a button)
    const lastMessage = messages[messages.length - 1];
    const alreadyAdded = lastMessage && lastMessage.role === 'user' && lastMessage.content === content;
    
    if (!alreadyAdded) {
      addMessage(content, 'user');
    }
    
    setIsProcessing(true);
    setShouldFocusInput(false); // Reset focus flag when user sends message

    try {
      // Check if OpenAI API key is available
      const useAI = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your-api-key-here';
      
      if (!useAI) {
        // Fallback to basic response if no API key
        addMessage(
          "I'd love to help you design your experiment! However, I need an OpenAI API key to have a natural conversation. Please set up your API key in the .env.local file. For now, you can try one of the example hypotheses above.",
          'assistant'
        );
        setIsProcessing(false);
        return;
      }

      // Convert our messages to OpenAI format
      // Skip the welcome message as it's already in the system prompt
      const openAIMessages = messages
        .filter(msg => msg.id !== 'welcome')
        .map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
      
      // The new user message is already added via addMessage above, so it's in messages
      // But we need to make sure it's included - check if last message is our new one
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user' && lastMessage.content === content) {
        // Already included, just use it
      } else {
        // Add it explicitly
        openAIMessages.push({
          role: 'user' as const,
          content: content
        });
      }

      // Check if this is the first user message (before we add the current one)
      const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 0;
      
      // For the first message, try to parse it first and go straight to knowledge card/recommendation offer
      if (isFirstUserMessage && !hasShownKnowledgeCard && !state.parsed) {
        try {
          const useAI = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your-api-key-here';
          const parsed = useAI 
            ? await parseHypothesisWithAI(content)
            : parseHypothesis(content);
          
          if (parsed && parsed.intervention && parsed.outcome && parsed.intervention !== 'intervention' && parsed.outcome !== 'outcome') {
            setState(prev => ({
              ...prev,
              hypothesisText: content,
              parsed,
            }));
            
            // Go straight to knowledge card offer - skip AI chat response
            const promptMsg = addMessage(
              `I can show you a research-backed knowledge card about ${parsed.intervention} and its effects on ${parsed.outcome}. Would you like to see it?`,
              'assistant'
            );
            setKnowledgeCardPromptMessageId(promptMsg);
            setShowKnowledgeCardPrompt(true);
            setShouldFocusInput(true);
            setIsProcessing(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing hypothesis for first message:', error);
          // Fall through to normal AI chat flow if parsing fails
        }
      }
      
      // Check if we should try to extract info (every few messages or if we have enough context)
      const shouldExtractInfo = messages.length >= 2 || (state.parsed && messages.length >= 1);
      
      // Get AI response with optional info extraction
      const result = await chatWithAI(openAIMessages, shouldExtractInfo);
      
      // Parse options from AI response (only if AI provided them)
      const options = parseOptionsFromResponse(result.response);
      
      // Remove options from response text if options were found (to avoid duplication)
      const responseText = options.length > 0 
        ? removeOptionsFromResponse(result.response)
        : result.response;
      
      // Add AI response (without the options list)
      const assistantMsgId = addMessage(responseText, 'assistant');
      
      // Auto-focus input after AI responds (if no options provided)
      if (options.length === 0) {
        setTimeout(() => setShouldFocusInput(true), 100);
      }
      
      // Store options for this message ONLY if AI explicitly provided them
      // (Don't force options on every message - AI decides when to provide them)
      if (options.length > 0) {
        setMessageOptions(prev => {
          const newMap = new Map(prev);
          newMap.set(assistantMsgId, options);
          return newMap;
        });
      }
      
      // If we got extracted info, update state
      if (result.extractedInfo) {
        const extracted = result.extractedInfo;
        
        // Update state with extracted information
        if (extracted.intervention || extracted.outcome) {
          const newParsed: ParsedHypothesis = {
            intervention: extracted.intervention || state.parsed?.intervention || 'intervention',
            outcome: extracted.outcome || state.parsed?.outcome || 'outcome',
            category: (extracted.category as ParsedHypothesis['category']) || state.parsed?.category || 'general',
            confidence: state.parsed?.confidence || 0.9
          };
          
          setState(prev => ({
            ...prev,
            hypothesisText: prev.hypothesisText || content,
            parsed: newParsed,
            frequency: extracted.frequency || prev.frequency,
            timing: extracted.timing || prev.timing,
            outcomeContext: extracted.outcomeContext || prev.outcomeContext,
            wantsBaseline: extracted.wantsBaseline !== undefined ? extracted.wantsBaseline : true, // Default to true (always recommend baseline)
            baselineDays: extracted.baselineDays || prev.baselineDays,
            selectedControls: extracted.selectedControls || prev.selectedControls,
          }));
        }
      } else if (isFirstUserMessage && !hasShownKnowledgeCard && !state.parsed) {
        // If no extracted info but this is the first message, try to parse it immediately
        // This handles cases where the AI doesn't use function calling on the first message
        try {
          const useAI = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your-api-key-here';
          const parsed = useAI 
            ? await parseHypothesisWithAI(content)
            : parseHypothesis(content);
          
          if (parsed && parsed.intervention && parsed.outcome && parsed.intervention !== 'intervention' && parsed.outcome !== 'outcome') {
            setState(prev => ({
              ...prev,
              hypothesisText: content,
              parsed,
            }));
            
            // Suggest showing knowledge card and creating full recommendation
            const promptMsg = addMessage(
              `Great! I can help you with a few things:\n\n1. **Knowledge Card**: I can show you a research-backed knowledge card about ${parsed.intervention} and its effects on ${parsed.outcome}.\n\n2. **Full Hypothesis Recommendation**: I can put together a complete hypothesis testing recommendation based on what you've shared. This will be fully customizable - you can make any changes you'd like.\n\nWould you like me to proceed with both, or would you prefer to make any changes first?`,
              'assistant'
            );
            setKnowledgeCardPromptMessageId(promptMsg);
            setShowKnowledgeCardPrompt(true);
            setShouldFocusInput(true);
          }
        } catch (error) {
          console.error('Error parsing hypothesis for knowledge card:', error);
        }
      }

      // If ready to create, show summary instead of creating immediately
      if (result.extractedInfo?.isReadyToCreate && state.parsed) {
        // Show summary message first
        const summaryMsg = addMessage(
          "Great! I have all the information I need. Let me show you a summary of your experiment:",
          'assistant'
        );
        setSummaryMessageId(summaryMsg);
        setShowSummary(true);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'I encountered an error. Please try again or rephrase your message.';
      
      // If it's an API key error, provide helpful guidance
      if (errorMessage.includes('API key') || errorMessage.includes('OpenAI')) {
        addMessage(
          "I need an OpenAI API key to have a conversation. Please set NEXT_PUBLIC_OPENAI_API_KEY in your .env.local file. See SETUP_API_KEY.md for instructions.",
          'assistant'
        );
      } else {
        addMessage(
          `I encountered an error: ${errorMessage}. Please try again or check your API configuration.`,
          'assistant'
        );
      }
    } finally {
      setIsProcessing(false);
      // Focus input after processing is complete (if no options were provided)
      // Reset the flag first, then set it to trigger focus
      setShouldFocusInput(false);
      setTimeout(() => setShouldFocusInput(true), 150);
    }
  };


  const resetChat = () => {
    // Reset all state
    setMessages([]);
    setStep('chatting');
    setIsProcessing(false);
    setKnowledgeCardAfterMessageId(null);
    setHasShownKnowledgeCard(false);
    setShowSummary(false);
    setSummaryMessageId(null);
    setMessageOptions(new Map());
    setShowReplaceConfirmation(false);
    setReplaceConfirmationMessageId(null);
    setShouldFocusInput(false);
    setShowKnowledgeCardPrompt(false);
    setKnowledgeCardPromptMessageId(null);
    setState({
      hypothesisText: '',
      wantsBaseline: true, // Always recommend baseline
      baselineDays: 7,
      selectedControls: [],
      suggestedControls: [],
      currentQuestionIndex: 0,
      clarifyingQuestions: [],
    });
    setCurrentConversationId(null);
    
    // Show welcome message
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm here to help you design a personal experiment. What hypothesis would you like to test? For example, you might want to see if taking omega-3 improves your focus, or if meditation reduces your stress.",
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
    setShouldFocusInput(true);
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
    // Map old step values to new ones
    const oldStep = conversation.state.step;
    const newStep = oldStep === 'complete' ? 'complete' : 'chatting';
    setStep(newStep);
    setKnowledgeCardAfterMessageId(conversation.state.knowledgeCardAfterMessageId || null);
    setHasShownKnowledgeCard(!!conversation.state.knowledgeCard);
    setCurrentConversationId(conversation.id);
    // Allow saving after a brief delay
    setTimeout(() => setIsLoadingConversation(false), 100);
  };

  // Parse options from AI response (looks for "Options:" or "-" list)
  const parseOptionsFromResponse = (response: string): string[] => {
    const options: string[] = [];
    
    // Look for "Options:" section
    const optionsMatch = response.match(/Options?:\s*\n((?:[-•]\s*.+\n?)+)/i);
    if (optionsMatch) {
      const optionsText = optionsMatch[1];
      const optionLines = optionsText.split('\n').filter(line => line.trim());
      optionLines.forEach(line => {
        // Remove "- " or "• " prefix
        const cleaned = line.replace(/^[-•]\s*/, '').trim();
        if (cleaned) {
          options.push(cleaned);
        }
      });
    } else {
      // Fallback: look for lines starting with "-" or "•"
      const lines = response.split('\n');
      let inOptionsSection = false;
      lines.forEach(line => {
        if (line.toLowerCase().includes('option')) {
          inOptionsSection = true;
          return;
        }
        if (inOptionsSection && /^[-•]\s*/.test(line.trim())) {
          const cleaned = line.replace(/^[-•]\s*/, '').trim();
          if (cleaned && !cleaned.toLowerCase().includes('question')) {
            options.push(cleaned);
          }
        }
      });
    }
    
    return options;
  };

  // Remove options section from response text (to avoid duplicating in chat)
  const removeOptionsFromResponse = (response: string): string => {
    const lines = response.split('\n');
    const result: string[] = [];
    let inOptionsSection = false;
    let foundOptionsHeader = false;
    let foundQuestionHeader = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const isOptionsHeader = /^Options?:/i.test(trimmed);
      const isQuestionHeader = /^Question:?/i.test(trimmed);
      const isBullet = /^[-•]\s*/.test(trimmed);
      
      // Check if this is the "Question:" header (which might appear before options)
      if (isQuestionHeader) {
        foundQuestionHeader = true;
        // Don't include the "Question:" line itself, just the question text
        const questionText = trimmed.replace(/^Question:?\s*/i, '').trim();
        if (questionText) {
          result.push(questionText);
        }
        continue;
      }
      
      // Check if this is the "Options:" header
      if (isOptionsHeader) {
        foundOptionsHeader = true;
        inOptionsSection = true;
        continue; // Skip the header line
      }
      
      // If we found the header, skip all subsequent bullet points
      if (inOptionsSection && isBullet) {
        continue; // Skip bullet points in options section
      }
      
      // If we're in options section and hit a non-bullet, non-empty line, stop skipping
      if (inOptionsSection && trimmed && !isBullet) {
        inOptionsSection = false;
        // Add this line if it's not part of options
        result.push(line);
        continue;
      }
      
      // If we're in options section and hit an empty line after bullets, stop skipping
      if (inOptionsSection && !trimmed && foundOptionsHeader) {
        inOptionsSection = false;
      }
      
      // Only add lines that aren't part of the options section
      if (!inOptionsSection) {
        result.push(line);
      }
    }
    
    // Clean up trailing empty lines
    while (result.length > 0 && result[result.length - 1].trim() === '') {
      result.pop();
    }
    
    return result.join('\n').trim();
  };

  const startNewConversation = () => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm here to help you design a personal experiment. What hypothesis would you like to test? For example, you might want to see if taking omega-3 improves your focus, or if meditation reduces your stress.",
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
    setStep('chatting');
    setState({
      hypothesisText: '',
      wantsBaseline: true, // Always recommend baseline
      baselineDays: 7,
      selectedControls: [],
      suggestedControls: [],
      currentQuestionIndex: 0,
      clarifyingQuestions: [],
    });
    setKnowledgeCardAfterMessageId(null);
    setHasShownKnowledgeCard(false);
    setCurrentConversationId(null);
  };

  const createAndSaveHypothesis = (replaceExisting: boolean = false) => {
    if (!state.parsed) return;

    // If replacing, archive all active hypotheses
    if (replaceExisting) {
      const activeHypotheses = getActiveHypotheses();
      activeHypotheses.forEach(h => {
        archiveHypothesis(h.id);
      });
    }

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
    // Always include baseline phase (it's always recommended)
    if (state.parsed.intervention.toLowerCase().includes('exercise') || 
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
      // Always include baseline phase (always recommended)
      baselinePhase: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + state.baselineDays * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
      },
      interventionStartDate: new Date(Date.now() + state.baselineDays * 24 * 60 * 60 * 1000).toISOString(),
      context: {
        frequency: state.frequency,
        timing: state.timing,
        specificContext: state.outcomeContext,
      },
      conversationId: currentConversationId || undefined,
    };
    
    saveHypothesis(hypothesis);
    
    addMessage(
      `✨ **Experiment Created!**\n\nYour hypothesis is now live. Head to the **Track** tab to start logging data.\n\n⏰ **Baseline Phase**: Track your baseline for ${state.baselineDays} days before starting ${state.parsed.intervention}. This helps establish a comparison point for more reliable results!\n\nGood luck with your experiment! 🎯`,
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

      {/* Restart Button */}
      {messages.length > 1 && (
        <button
          onClick={() => {
            if (confirm('Are you sure you want to clear the chat and start over?')) {
              resetChat();
            }
          }}
          className="absolute right-4 top-16 z-30 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Restart Chat"
          title="Clear and restart"
        >
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      )}

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
              {msg.id === 'welcome' && step === 'chatting' && (
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
              
              {/* Show experiment summary after summary message */}
              {msg.id === summaryMessageId && showSummary && state.parsed && (
                <ExperimentSummary
                  hypothesisText={state.hypothesisText || ''}
                  parsed={state.parsed}
                  knowledgeCard={state.knowledgeCard}
                  frequency={state.frequency}
                  timing={state.timing}
                  outcomeContext={state.outcomeContext}
                  wantsBaseline={state.wantsBaseline}
                  baselineDays={state.baselineDays}
                  selectedControls={state.selectedControls}
                  onConfirm={() => {
                    setShowSummary(false);
                    // Check if there are active hypotheses
                    const activeHypotheses = getActiveHypotheses();
                    if (activeHypotheses.length > 0) {
                      // Show replacement confirmation
                      const confirmMsg = addMessage(
                        `I see you have ${activeHypotheses.length} active experiment${activeHypotheses.length > 1 ? 's' : ''} running:\n\n${activeHypotheses.map((h, idx) => `${idx + 1}. ${h.question.substring(0, 60)}${h.question.length > 60 ? '...' : ''}`).join('\n')}\n\nWould you like to replace ${activeHypotheses.length > 1 ? 'these' : 'this'} with your new experiment, or keep both active?`,
                        'assistant'
                      );
                      setReplaceConfirmationMessageId(confirmMsg);
                      setShowReplaceConfirmation(true);
                    } else {
                      // No active hypotheses, create directly
                      createAndSaveHypothesis();
                    }
                  }}
                  onCancel={() => {
                    setShowSummary(false);
                    addMessage(
                      "No problem! Feel free to ask any questions or make changes to your experiment setup.",
                      'assistant'
                    );
                  }}
                />
              )}
              
              {/* Show clickable options for assistant messages */}
              {msg.role === 'assistant' && messageOptions.has(msg.id) && (
                <QuestionOptions
                  options={messageOptions.get(msg.id) || []}
                  onSelect={(option) => {
                    // Add the selected option as a user message first
                    addMessage(option, 'user');
                    // Remove options after selection
                    setMessageOptions(prev => {
                      const newMap = new Map(prev);
                      newMap.delete(msg.id);
                      return newMap;
                    });
                    // Then process it as a user message
                    handleUserMessage(option);
                    // Focus input after selecting option (in case no new options appear)
                    setTimeout(() => setShouldFocusInput(true), 500);
                  }}
                  disabled={isProcessing}
                />
              )}
              
              {/* Show knowledge card prompt options */}
              {msg.id === knowledgeCardPromptMessageId && showKnowledgeCardPrompt && (
                <div className="mt-3 space-y-2">
                  <QuestionOptions
                    options={[
                      'Yes, show me the knowledge card',
                      'No, skip for now'
                    ]}
                    onSelect={async (option) => {
                      // Add the selected option as a user message first
                      addMessage(option, 'user');
                      
                      const lowerOption = option.toLowerCase();
                      const wantsCard = lowerOption.includes('yes') || lowerOption.includes('show');
                      
                      setShowKnowledgeCardPrompt(false);
                      
                      if (wantsCard && state.parsed) {
                        // Generate and show knowledge card
                        // Show loading message while generating
                        const loadingMsgId = addMessage("We're pulling that up...", 'assistant');
                        
                        try {
                          const useAI = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your-api-key-here';
                          const knowledgeCard = useAI
                            ? await generateKnowledgeCardWithAI(state.parsed!.intervention, state.parsed!.outcome, state.parsed!.category)
                            : generateKnowledgeCard(state.parsed!.intervention, state.parsed!.outcome, state.parsed!.category);
                          
                          // Remove loading message
                          setMessages(prev => prev.filter(msg => msg.id !== loadingMsgId));
                          
                          setState(prev => ({
                            ...prev,
                            knowledgeCard,
                            suggestedControls: knowledgeCard.relatedControls,
                          }));
                          
                          setHasShownKnowledgeCard(true);
                          // Add the "Great!" message and set the knowledge card to appear after it
                          const greatMsgId = addMessage("Great! Here's what the research says about this:", 'assistant');
                          setKnowledgeCardAfterMessageId(greatMsgId);
                          
                          // After showing knowledge card, immediately start asking questions
                          setTimeout(async () => {
                            setIsProcessing(true);
                            try {
                              const useAI = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your-api-key-here';
                              if (useAI) {
                                const openAIMessages = messages
                                  .filter(msg => msg.id !== 'welcome' && msg.id !== loadingMsgId)
                                  .map(msg => ({
                                    role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                                    content: msg.content
                                  }));
                                
                                const result = await chatWithAI(openAIMessages, true);
                                const options = parseOptionsFromResponse(result.response);
                                const responseText = options.length > 0 
                                  ? removeOptionsFromResponse(result.response)
                                  : result.response;
                                
                                const assistantMsgId = addMessage(responseText, 'assistant');
                                
                                if (options.length === 0) {
                                  setTimeout(() => setShouldFocusInput(true), 100);
                                }
                                
                                if (options.length > 0) {
                                  setMessageOptions(prev => {
                                    const newMap = new Map(prev);
                                    newMap.set(assistantMsgId, options);
                                    return newMap;
                                  });
                                }
                                
                                // Update state if extracted info
                                if (result.extractedInfo) {
                                  const extracted = result.extractedInfo;
                                  if (extracted.intervention || extracted.outcome) {
                                    const newParsed: ParsedHypothesis = {
                                      intervention: extracted.intervention || state.parsed?.intervention || 'intervention',
                                      outcome: extracted.outcome || state.parsed?.outcome || 'outcome',
                                      category: (extracted.category as ParsedHypothesis['category']) || state.parsed?.category || 'general',
                                      confidence: state.parsed?.confidence || 0.9
                                    };
                                    
                                    setState(prev => ({
                                      ...prev,
                                      parsed: newParsed,
                                      frequency: extracted.frequency || prev.frequency,
                                      timing: extracted.timing || prev.timing,
                                      outcomeContext: extracted.outcomeContext || prev.outcomeContext,
                                      wantsBaseline: extracted.wantsBaseline !== undefined ? extracted.wantsBaseline : true,
                                      baselineDays: extracted.baselineDays || prev.baselineDays,
                                      selectedControls: extracted.selectedControls || prev.selectedControls,
                                    }));
                                  }
                                }
                              }
                            } catch (error) {
                              console.error('Error starting conversation:', error);
                            } finally {
                              setIsProcessing(false);
                              setTimeout(() => setShouldFocusInput(true), 150);
                            }
                          }, 1500);
                        } catch (error) {
                          // Remove loading message on error
                          setMessages(prev => prev.filter(msg => msg.id !== loadingMsgId));
                          console.error('Error generating knowledge card:', error);
                          addMessage("I encountered an error generating the knowledge card. Let's continue with your experiment setup.", 'assistant');
                        }
                      } else {
                        // User said no to knowledge card, immediately start asking questions
                        setTimeout(async () => {
                          setIsProcessing(true);
                          try {
                            const useAI = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your-api-key-here';
                            if (useAI) {
                              const openAIMessages = messages
                                .filter(msg => msg.id !== 'welcome')
                                .map(msg => ({
                                  role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                                  content: msg.content
                                }));
                              
                              const result = await chatWithAI(openAIMessages, true);
                              const options = parseOptionsFromResponse(result.response);
                              const responseText = options.length > 0 
                                ? removeOptionsFromResponse(result.response)
                                : result.response;
                              
                              const assistantMsgId = addMessage(responseText, 'assistant');
                              
                              if (options.length === 0) {
                                setTimeout(() => setShouldFocusInput(true), 100);
                              }
                              
                              if (options.length > 0) {
                                setMessageOptions(prev => {
                                  const newMap = new Map(prev);
                                  newMap.set(assistantMsgId, options);
                                  return newMap;
                                });
                              }
                              
                              // Update state if extracted info
                              if (result.extractedInfo) {
                                const extracted = result.extractedInfo;
                                if (extracted.intervention || extracted.outcome) {
                                  const newParsed: ParsedHypothesis = {
                                    intervention: extracted.intervention || state.parsed?.intervention || 'intervention',
                                    outcome: extracted.outcome || state.parsed?.outcome || 'outcome',
                                    category: (extracted.category as ParsedHypothesis['category']) || state.parsed?.category || 'general',
                                    confidence: state.parsed?.confidence || 0.9
                                  };
                                  
                                  setState(prev => ({
                                    ...prev,
                                    parsed: newParsed,
                                    frequency: extracted.frequency || prev.frequency,
                                    timing: extracted.timing || prev.timing,
                                    outcomeContext: extracted.outcomeContext || prev.outcomeContext,
                                    wantsBaseline: extracted.wantsBaseline !== undefined ? extracted.wantsBaseline : true,
                                    baselineDays: extracted.baselineDays || prev.baselineDays,
                                    selectedControls: extracted.selectedControls || prev.selectedControls,
                                  }));
                                }
                              }
                            }
                          } catch (error) {
                            console.error('Error starting conversation:', error);
                          } finally {
                            setIsProcessing(false);
                            setTimeout(() => setShouldFocusInput(true), 150);
                          }
                        }, 500);
                      }
                    }}
                    disabled={isProcessing}
                  />
                </div>
              )}
              
              {/* Show replacement confirmation options */}
              {msg.id === replaceConfirmationMessageId && showReplaceConfirmation && (
                <div className="mt-3 space-y-2">
                  <QuestionOptions
                    options={[
                      'Yes, replace the current experiment(s)',
                      'No, keep both active'
                    ]}
                    onSelect={(option) => {
                      // Add the selected option as a user message first
                      addMessage(option, 'user');
                      
                      setShowReplaceConfirmation(false);
                      const shouldReplace = option.toLowerCase().includes('yes') || option.toLowerCase().includes('replace');
                      
                      if (shouldReplace) {
                        addMessage(
                          "Got it! I'll replace your current experiment(s) with the new one.",
                          'assistant'
                        );
                        createAndSaveHypothesis(true);
                      } else {
                        addMessage(
                          "I'll keep both experiments active. You can track multiple experiments at once!",
                          'assistant'
                        );
                        createAndSaveHypothesis(false);
                      }
                    }}
                    disabled={isProcessing}
                  />
                </div>
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
            autoFocus={shouldFocusInput}
          />
          {step === 'chatting' && getActiveHypotheses().length > 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              💡 You have active experiments. Create another or go to Track.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-x-0 top-0 bottom-16 flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <AppHeader />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
