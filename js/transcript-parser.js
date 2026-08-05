// ================================================================
// TRANSCRIPT PARSER - Production-Ready Hybrid Parser
// Combines regex, rule-based logic, NLP-like processing,
// contextual inference, and confidence scoring
// ================================================================

class TranscriptParser {
    constructor() {
        this.version = '2.0.0';
        this.confidenceThreshold = 0.6;
        
        // Field extraction patterns with confidence weights
        this.patterns = {
            business: {
                patterns: [
                    /(?:business|company|organization|org|firm|brand|store|shop)[:\s]+([A-Z][A-Za-z0-9\s&'\-.,]+?)(?:[,.\n]|$)/i,
                    /(?:from|at|with|for)\s+([A-Z][A-Za-z0-9\s&'\-.,]+?)(?:[,.\n]|$)/i,
                    /(?:called|named)\s+([A-Z][A-Za-z0-9\s&'\-.,]+?)(?:[,.\n]|$)/i,
                    /^([A-Z][A-Za-z0-9\s&'\-.,]+?)(?:\s+(?:is|are|was|were|has|have|had|said|wants))/i,
                    /is this\s+([A-Z][A-Za-z0-9\s&'\-.,]+?)(?:[?.,!]|$)/i,
                    /(?:business name|company name)[:\s]+([A-Z][A-Za-z0-9\s&'\-.,]+?)(?:[,.\n]|$)/i
                ],
                weight: 1.0,
                minConfidence: 0.4
            },
            name: {
                patterns: [
                    /(?:name|contact|client|customer|person|full name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
                    /(?:from|with|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
                    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:from|at|with|said|wants|would like)/i,
                    /(?:my name is|this is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
                    /Prospect:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
                    /(?:call|talk to|speak with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
                ],
                weight: 0.9,
                minConfidence: 0.4
            },
            role: {
                patterns: [
                    /(?:role|title|position|job title|designation)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
                    /(?:owner|manager|ceo|director|supervisor|team lead|president|founder|co-founder|administrator)/i,
                    /i am the\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
                    /(?:he's|she's|they're)\s+the\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
                ],
                weight: 0.7,
                minConfidence: 0.3
            },
            phone: {
                patterns: [
                    /(?:phone|mobile|cell|telephone|number|call|contact)[:\s]+([+\d\s\-\(\)]{7,20})/i,
                    /([+\d\s\-\(\)]{10,20})(?:\s*(?:is|was|will be|the|their|his|her))/i,
                    /(\d{3}[-.]?\d{3}[-.]?\d{4})/,
                    /\(\d{3}\)\s*\d{3}[-.]?\d{4}/,
                    /(\+\d{1,3}[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4})/,
                    /(?:call|text|phone|mobile)\s+([+\d\s\-\(\)]{7,20})/i
                ],
                weight: 0.9,
                minConfidence: 0.5
            },
            email: {
                patterns: [
                    /([^\s@]+@[^\s@]+\.[^\s@]+)/,
                    /(?:email|e-mail|mail|address)[:\s]+([^\s@]+@[^\s@]+\.[^\s@]+)/i,
                    /(?:send|sent|forward)\s+to\s+([^\s@]+@[^\s@]+\.[^\s@]+)/i
                ],
                weight: 1.0,
                minConfidence: 0.6
            },
            date: {
                patterns: [
                    /(?:date|appointment|scheduled|meeting|call|day|on)[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
                    /(\d{1,2}\/\d{1,2}\/\d{4})/,
                    /(\d{4}-\d{2}-\d{2})/,
                    /([A-Za-z]+\s+\d{1,2},?\s+\d{4})/,
                    /(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
                    /(?:tomorrow|today|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
                    /(?:this|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
                ],
                weight: 0.8,
                minConfidence: 0.4
            },
            time: {
                patterns: [
                    /(?:time|at|for)[:\s]+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i,
                    /(?:time|at|for)[:\s]+(\d{1,2}\s*(?:AM|PM|am|pm))/i,
                    /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/,
                    /(\d{1,2}\s*(?:AM|PM|am|pm))/,
                    /(?:morning|afternoon|evening|night|noon|midnight)/i
                ],
                weight: 0.8,
                minConfidence: 0.4
            },
            status: {
                patterns: [
                    /(?:status|state|stage|lead status|appointment status|call status)[:\s]+([A-Za-z\s]+)/i,
                    /(?:meeting booked|booked|scheduled|confirmed|set up|locked in|calendar invite)/i,
                    /(?:hot transfer|hot lead|ready to transfer|transferring now|take it over)/i,
                    /(?:warm callback|call back|follow up|follow-up|callback|call me back|get back to)/i,
                    /(?:completed|done|finished|closed|wrapped up|finalized)/i,
                    /(?:canceled|cancelled|no show|didn't show|not interested|no longer|passed)/i,
                    /(?:rescheduled|reschedule|postponed|pushed back|moved to|another time)/i,
                    /(?:pending|waiting|undecided|thinking|considering|maybe)/i
                ],
                weight: 0.7,
                minConfidence: 0.3
            },
            websiteStatus: {
                patterns: [
                    /(?:website|site|web|online presence)(?:\s+(?:status|state|condition|situation))?[:\s]+([A-Za-z\s]+)/i,
                    /(?:no website|doesn't have a website|needs website|wants website|website redesign|new site|current site)/i,
                    /(?:website (?:is|was|has|doesn't|don't|not))\s+([A-Za-z\s]+)/i,
                    /(?:we have|we don't have|we need|we want|we're getting)\s+(?:a|an|the)?\s*(?:website|site)/i
                ],
                weight: 0.6,
                minConfidence: 0.3
            },
            businessGoals: {
                patterns: [
                    /(?:goal|objective|aim|purpose|want|need|looking for|hoping to|trying to)[:\s]+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i,
                    /(?:wants to|wanted to|would like to|hopes to|plans to)\s+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i
                ],
                weight: 0.5,
                minConfidence: 0.3
            },
            acquisitionMethod: {
                patterns: [
                    /(?:found|discovered|learned about|came across|heard about|saw)[:\s]+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i,
                    /(?:how did you hear|where did you find|through|via|from)\s+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i,
                    /(?:google|search|online|social media|facebook|instagram|linkedin|referral|word of mouth|ad|advertisement)/i
                ],
                weight: 0.4,
                minConfidence: 0.2
            },
            websitePurpose: {
                patterns: [
                    /(?:purpose|reason|why|for)[:\s]+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i,
                    /(?:website (?:is|was|will be|should be|would be))\s+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i,
                    /(?:generate leads|sell products|showcase work|inform customers|build brand|increase visibility|get more customers)/i
                ],
                weight: 0.5,
                minConfidence: 0.3
            },
            brandingPreferences: {
                patterns: [
                    /(?:brand|branding|style|design|look and feel|color|theme)[:\s]+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i,
                    /(?:prefer|like|want|wanting|looking for)\s+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i,
                    /(?:modern|minimalist|professional|elegant|sophisticated|vibrant|bold|clean|simple|complex|traditional)/i
                ],
                weight: 0.4,
                minConfidence: 0.2
            },
            callbackReason: {
                patterns: [
                    /(?:callback|call back|follow up|follow-up|next steps|schedule call|call me)[:\s]+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i,
                    /(?:reason for callback|why are you calling back|purpose of call|need to call back)/i
                ],
                weight: 0.5,
                minConfidence: 0.3
            },
            interestLevel: {
                patterns: [
                    /(?:interest|interested|excited|enthusiastic|positive|keen)[:\s]+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i,
                    /(?:very interested|quite interested|somewhat interested|not interested|not sure)/i,
                    /(?:love it|like it|hate it|not sure|maybe|definitely|absolutely)/i
                ],
                weight: 0.6,
                minConfidence: 0.3
            },
            followUpActions: {
                patterns: [
                    /(?:follow up|follow-up|next step|action item|to do|task)[:\s]+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i,
                    /(?:need to|should|will|going to)\s+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i,
                    /(?:send|call|email|schedule|prepare|review|discuss)\s+([A-Za-z0-9\s,.'"\-]+?)(?:[,.\n]|$)/i
                ],
                weight: 0.5,
                minConfidence: 0.3
            }
        };

        // Sentiment analysis patterns
        this.sentimentPatterns = {
            veryPositive: /(?:amazing|excellent|outstanding|fantastic|perfect|brilliant|incredible|wonderful|extraordinary|love it|great job|absolutely|definitely)/i,
            positive: /(?:great|good|nice|positive|happy|pleased|satisfied|impressed|interested|excited|enthusiastic|awesome|sounds good|like it)/i,
            neutral: /(?:okay|fine|alright|neutral|average|decent|moderate|standard|normal|not bad|so-so)/i,
            negative: /(?:bad|poor|terrible|awful|horrible|disappointed|unhappy|frustrated|annoyed|irritated|not good|don't like)/i,
            veryNegative: /(?:worst|horrible|disgusting|atrocious|abysmal|appalling|dreadful|unacceptable|never|hate)/i
        };

        // Objection patterns
        this.objectionPatterns = [
            { pattern: /(?:not interested|no thanks|don't need|not right now)/i, type: 'reflex' },
            { pattern: /(?:too busy|don't have time|busy right now|can't talk)/i, type: 'reflex' },
            { pattern: /(?:already have|already got|we already|currently have)/i, type: 'we_dont_need' },
            { pattern: /(?:too expensive|cost too much|price is high|budget)/i, type: 'skeptical' },
            { pattern: /(?:call me back|not now|later|some other time)/i, type: 'gatekeeper' },
            { pattern: /(?:send info|email me|just send|information)/i, type: 'gatekeeper' },
            { pattern: /(?:who is this|how did you|where did you|why are you)/i, type: 'gatekeeper' }
        ];

        // Tag patterns
        this.tagPatterns = {
            vip: /(?:vip|priority|important|key|major|top|high value|premium|executive)/i,
            qualified_warm_call: /(?:qualified|warm call|good fit|ideal|perfect fit|qualified lead|interested|positive|high potential)/i,
            high_interest: /(?:high interest|very interested|excited|enthusiastic|love it|strong interest)/i,
            decision_maker: /(?:owner|ceo|president|founder|director|decision maker|manager|executive)/i,
            callback_requested: /(?:callback|call back|return call|follow up|follow-up|next steps|schedule call|call me)/i,
            referred: /(?:referred|reference|referral|recommended|suggested|from|sent by|introduced)/i,
            no_website: /(?:no website|doesn't have a website|needs website|wants website|website redesign|new site|missing site)/i,
            negligent_warm_callback: /(?:negligent|unqualified|not interested|no interest|poor fit|bad fit|waste of time)/i
        };
    }

    // ================================================================
    // MAIN PARSING METHOD
    // ================================================================

    /**
     * Parse a transcript and extract all fields with confidence scores
     * @param {string} transcript - The conversation transcript
     * @param {Object} options - Parser options
     * @returns {Object} Parsed result with all fields and confidence scores
     */
    parse(transcript, options = {}) {
        const startTime = Date.now();
        
        // Normalize transcript
        const normalized = this._normalizeTranscript(transcript);
        const lines = normalized.split('\n').filter(line => line.trim());
        const fullText = lines.join(' ');
        const words = fullText.split(/\s+/);

        // Initialize result
        const result = {
            business: { value: 'N/A', confidence: 0, evidence: '' },
            name: { value: 'N/A', confidence: 0, evidence: '' },
            role: { value: 'N/A', confidence: 0, evidence: '' },
            phone: { value: 'N/A', confidence: 0, evidence: '' },
            email: { value: 'N/A', confidence: 0, evidence: '' },
            date: { value: 'N/A', confidence: 0, evidence: '' },
            time: { value: 'N/A', confidence: 0, evidence: '' },
            status: { value: 'N/A', confidence: 0, evidence: '' },
            websiteStatus: { value: 'N/A', confidence: 0, evidence: '' },
            businessGoals: { value: 'N/A', confidence: 0, evidence: '' },
            acquisitionMethod: { value: 'N/A', confidence: 0, evidence: '' },
            websitePurpose: { value: 'N/A', confidence: 0, evidence: '' },
            brandingPreferences: { value: 'N/A', confidence: 0, evidence: '' },
            callbackReason: { value: 'N/A', confidence: 0, evidence: '' },
            interestLevel: { value: 'N/A', confidence: 0, evidence: '' },
            followUpActions: { value: [], confidence: 0, evidence: '' },
            developerNotes: { value: '', confidence: 0, evidence: '' },
            tags: { value: [], confidence: 0, evidence: '' },
            sentiment: { value: 'Neutral', confidence: 0, evidence: '' },
            objections: { value: [], confidence: 0, evidence: '' },
            callSummary: { value: '', confidence: 0, evidence: '' },
            meetingQualityScore: { value: 5, confidence: 0, evidence: '' },
            missingInformation: { value: [], confidence: 0, evidence: '' },
            suggestedFollowUp: { value: [], confidence: 0, evidence: '' },
            _metadata: {
                parseTime: 0,
                wordCount: words.length,
                lineCount: lines.length,
                confidenceThreshold: this.confidenceThreshold
            }
        };

        // Extract fields using patterns
        this._extractFields(result, fullText, lines);

        // Apply contextual inference
        this._applyContextualInference(result, fullText, lines);

        // Apply confidence scoring
        this._applyConfidenceScoring(result, fullText);

        // Generate developer notes
        result.developerNotes.value = this._generateDeveloperNotes(result, fullText);

        // Generate call summary
        result.callSummary.value = this._generateCallSummary(result, fullText);

        // Detect sentiment
        result.sentiment.value = this._detectSentiment(fullText);

        // Detect objections
        result.objections.value = this._detectObjections(fullText);

        // Detect tags
        result.tags.value = this._detectTags(fullText);

        // Calculate meeting quality score
        result.meetingQualityScore.value = this._calculateQualityScore(result, fullText);

        // Detect missing information
        result.missingInformation.value = this._detectMissingInfo(result);

        // Generate suggested follow-up
        result.suggestedFollowUp.value = this._generateFollowUpSuggestions(result);

        // Calculate metadata
        result._metadata.parseTime = Date.now() - startTime;

        return result;
    }

    // ================================================================
    // NORMALIZATION
    // ================================================================

    _normalizeTranscript(transcript) {
        if (!transcript) return '';
        
        let normalized = transcript
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // Fix common typos
            .replace(/\b(?:ur|your|you're)\b/gi, 'your')
            .replace(/\b(?:u|you)\b/gi, 'you')
            .replace(/\b(?:plz|please)\b/gi, 'please')
            .replace(/\b(?:thx|thanks|thanx)\b/gi, 'thanks')
            // Clean up extra spaces
            .replace(/\s+/g, ' ')
            .trim();
        
        return normalized;
    }

    // ================================================================
    // FIELD EXTRACTION
    // ================================================================

    _extractFields(result, fullText, lines) {
        for (const [field, config] of Object.entries(this.patterns)) {
            for (const pattern of config.patterns) {
                const match = fullText.match(pattern);
                if (match && match[1]) {
                    const value = match[1].trim();
                    if (value && value.length > 1) {
                        const evidence = match[0].trim();
                        const confidence = this._calculateConfidence(value, field, pattern, fullText);
                        const fieldKey = field;
                        
                        if (fieldKey === 'followUpActions') {
                            // Special handling for arrays
                            if (!Array.isArray(result[fieldKey].value)) {
                                result[fieldKey].value = [];
                            }
                            result[fieldKey].value.push(value);
                            result[fieldKey].confidence = Math.max(result[fieldKey].confidence, confidence);
                            result[fieldKey].evidence = evidence;
                        } else if (typeof result[fieldKey].value === 'string') {
                            // Only update if confidence is higher or field is still N/A
                            if (result[fieldKey].value === 'N/A' || confidence > result[fieldKey].confidence) {
                                result[fieldKey].value = value;
                                result[fieldKey].confidence = confidence;
                                result[fieldKey].evidence = evidence;
                            }
                        }
                    }
                }
            }
        }
    }

    // ================================================================
    // CONFIDENCE SCORING - FIXED
    // ================================================================

    _calculateConfidence(value, field, pattern, fullText) {
        // FIXED: Check if value is valid before using it in regex
        if (!value || typeof value !== 'string' || value === 'N/A' || value === '') {
            return 0.1;
        }

        let confidence = 0.3; // Base confidence

        // Sanitize value for regex - escape special characters
        let escapedValue;
        try {
            escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        } catch (e) {
            // If escaping fails, use a simple approach
            escapedValue = value.replace(/[^a-zA-Z0-9]/g, '');
        }

        // Check if value appears multiple times (higher confidence)
        try {
            const occurrences = (fullText.match(new RegExp(escapedValue, 'gi')) || []).length;
            if (occurrences > 2) confidence += 0.2;
            else if (occurrences > 1) confidence += 0.1;
        } catch (e) {
            // If regex fails, skip occurrence counting
            confidence += 0.05;
        }

        // Check if field is explicitly labeled (higher confidence)
        const fieldLabels = {
            business: ['business', 'company', 'organization', 'firm', 'brand', 'store'],
            name: ['name', 'contact', 'client', 'customer', 'person'],
            phone: ['phone', 'mobile', 'cell', 'telephone', 'number'],
            email: ['email', 'e-mail', 'mail', 'address'],
            date: ['date', 'appointment', 'scheduled', 'meeting', 'call'],
            time: ['time', 'at', 'for'],
            status: ['status', 'state', 'stage', 'lead', 'outcome']
        };

        if (fieldLabels[field]) {
            for (const label of fieldLabels[field]) {
                if (fullText.toLowerCase().includes(`${label}:`)) {
                    confidence += 0.1;
                    break;
                }
            }
        }

        // Check if value is in a key: value format
        if (new RegExp(`${field}[\\s]*:`, 'i').test(fullText)) {
            confidence += 0.15;
        }

        // Reduce confidence for short values
        if (value.length < 2) confidence -= 0.2;
        if (value.length < 4) confidence -= 0.1;

        return Math.max(0, Math.min(1, confidence));
    }

    _applyConfidenceScoring(result, fullText) {
        for (const [field, data] of Object.entries(result)) {
            if (data && typeof data === 'object' && 'confidence' in data) {
                // Apply minimum confidence based on evidence
                if (data.evidence && data.evidence.length > 0) {
                    data.confidence = Math.max(data.confidence, 0.3);
                }

                // Adjust confidence based on field type
                const fieldWeights = {
                    email: 1.0,
                    phone: 0.9,
                    business: 0.85,
                    name: 0.8,
                    date: 0.75,
                    time: 0.75,
                    status: 0.7,
                    role: 0.65,
                    websiteStatus: 0.6,
                    interestLevel: 0.6
                };

                if (fieldWeights[field]) {
                    data.confidence = Math.min(1, data.confidence * (1 + (1 - fieldWeights[field])));
                }

                // Round to 2 decimals
                data.confidence = Math.round(data.confidence * 100) / 100;
            }
        }
    }

    // ================================================================
    // CONTEXTUAL INFERENCE
    // ================================================================

    _applyContextualInference(result, fullText, lines) {
        // Infer business from context
        if (result.business.value === 'N/A') {
            const inferred = this._inferBusiness(fullText, lines);
            if (inferred) {
                result.business.value = inferred;
                result.business.confidence = 0.4;
                result.business.evidence = 'Inferred from context';
            }
        }

        // Infer name from context
        if (result.name.value === 'N/A') {
            const inferred = this._inferName(fullText, lines);
            if (inferred) {
                result.name.value = inferred;
                result.name.confidence = 0.4;
                result.name.evidence = 'Inferred from context';
            }
        }

        // Infer role from context
        if (result.role.value === 'N/A') {
            const inferred = this._inferRole(fullText);
            if (inferred) {
                result.role.value = inferred;
                result.role.confidence = 0.35;
                result.role.evidence = 'Inferred from context';
            }
        }

        // Infer date from context
        if (result.date.value === 'N/A') {
            const inferred = this._inferDate(fullText);
            if (inferred) {
                result.date.value = inferred;
                result.date.confidence = 0.35;
                result.date.evidence = 'Inferred from context';
            }
        }

        // Infer status from context
        if (result.status.value === 'N/A') {
            const inferred = this._inferStatus(fullText);
            if (inferred) {
                result.status.value = inferred;
                result.status.confidence = 0.35;
                result.status.evidence = 'Inferred from context';
            }
        }

        // Infer interest level
        if (result.interestLevel.value === 'N/A') {
            const inferred = this._inferInterest(fullText);
            if (inferred) {
                result.interestLevel.value = inferred;
                result.interestLevel.confidence = 0.4;
                result.interestLevel.evidence = 'Inferred from language';
            }
        }

        // Infer website status
        if (result.websiteStatus.value === 'N/A') {
            const inferred = this._inferWebsiteStatus(fullText);
            if (inferred) {
                result.websiteStatus.value = inferred;
                result.websiteStatus.confidence = 0.4;
                result.websiteStatus.evidence = 'Inferred from context';
            }
        }
    }

    // ================================================================
    // INFERENCE METHODS
    // ================================================================

    _inferBusiness(fullText, lines) {
        // Look for "is this" pattern
        const isThisMatch = fullText.match(/is this\s+([A-Z][A-Za-z0-9\s&'\-.,]+?)(?:[?.,!]|$)/i);
        if (isThisMatch) return isThisMatch[1].trim();

        // Look for business in first few lines
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i];
            // Skip lines with speaker labels
            const cleanLine = line.replace(/^[A-Za-z]+:\s*/, '');
            if (cleanLine && cleanLine.length > 3 && /[A-Z]/.test(cleanLine[0])) {
                const words = cleanLine.split(' ');
                if (words.length > 1 && words.length < 8) {
                    // Check if it looks like a business name
                    if (/[A-Z]/.test(cleanLine) && /[a-z]/.test(cleanLine)) {
                        return cleanLine.trim();
                    }
                }
            }
        }

        // Look for company indicators
        const companyMatch = fullText.match(/(?:from|at|with)\s+([A-Z][A-Za-z0-9\s&'\-.,]+?)(?:[,.\n]|$)/i);
        if (companyMatch) return companyMatch[1].trim();

        return null;
    }

    _inferName(fullText, lines) {
        // Look for "Prospect:" pattern
        const prospectMatch = fullText.match(/Prospect:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
        if (prospectMatch) return prospectMatch[1].trim();

        // Look for "my name is" pattern
        const nameMatch = fullText.match(/(?:my name is|this is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
        if (nameMatch) return nameMatch[1].trim();

        // Look for names in first few lines
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i];
            // Look for speaker label with name
            const speakerMatch = line.match(/^([A-Z][a-z]+):/);
            if (speakerMatch && speakerMatch[1] && !['Flynn', 'Manager', 'Agent'].includes(speakerMatch[1])) {
                return speakerMatch[1];
            }
        }

        return null;
    }

    _inferRole(fullText) {
        const roleIndicators = [
            { role: 'Owner', pattern: /(?:owner|i own|my business|my company)/i },
            { role: 'Manager', pattern: /(?:manager|manage|i manage|managing)/i },
            { role: 'CEO', pattern: /(?:ceo|chief executive|executive)/i },
            { role: 'Director', pattern: /(?:director|directing)/i },
            { role: 'Supervisor', pattern: /(?:supervisor|supervising|team lead|lead)/i },
            { role: 'Executive', pattern: /(?:executive|vp|vice president)/i },
            { role: 'Administrator', pattern: /(?:administrator|admin)/i }
        ];

        for (const indicator of roleIndicators) {
            if (indicator.pattern.test(fullText)) {
                return indicator.role;
            }
        }

        return null;
    }

    _inferDate(fullText) {
        const now = new Date();
        const today = this._formatDate(now);
        
        // Check for "tomorrow"
        if (/\btomorrow\b/i.test(fullText)) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return this._formatDate(tomorrow);
        }
        
        // Check for "today"
        if (/\btoday\b/i.test(fullText)) {
            return today;
        }
        
        // Check for day names
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        for (const day of dayNames) {
            if (new RegExp(`\\b${day}\\b`, 'i').test(fullText)) {
                const dayIndex = dayNames.indexOf(day);
                const currentDay = now.getDay();
                let daysToAdd = dayIndex - currentDay;
                if (daysToAdd <= 0) daysToAdd += 7;
                const date = new Date(now);
                date.setDate(date.getDate() + daysToAdd);
                return this._formatDate(date);
            }
        }

        // Check for "next week"
        if (/next week/i.test(fullText)) {
            const date = new Date(now);
            date.setDate(date.getDate() + 7);
            return this._formatDate(date);
        }

        return null;
    }

    _inferStatus(fullText) {
        const statusPatterns = [
            { status: 'Hot Transfer', pattern: /(?:hot transfer|hot lead|ready to transfer|transferring now|take it over|hand off)/i },
            { status: 'Warm Callback', pattern: /(?:warm callback|call back|follow up|follow-up|callback|call me back|get back to|touch base)/i },
            { status: 'Completed', pattern: /(?:completed|done|finished|closed|wrapped up|finalized)/i },
            { status: 'Canceled', pattern: /(?:canceled|cancelled|no show|didn't show|not interested|no longer|passed)/i },
            { status: 'Rescheduled', pattern: /(?:rescheduled|reschedule|postponed|pushed back|moved to|another time)/i },
            { status: 'Meeting Booked', pattern: /(?:meeting booked|booked|scheduled|confirmed|set up|locked in|calendar invite)/i },
            { status: 'Held', pattern: /(?:held|meeting done|conversation had|discussed|walked through|presented)/i }
        ];

        for (const sp of statusPatterns) {
            if (sp.pattern.test(fullText)) {
                return sp.status;
            }
        }

        return null;
    }

    _inferInterest(fullText) {
        const interestPatterns = [
            { level: 'Very High', pattern: /(?:very interested|extremely interested|excited|enthusiastic|love it|absolutely|definitely|amazing|excellent)/i },
            { level: 'High', pattern: /(?:interested|like it|sounds good|great|good|positive|keen|impressed)/i },
            { level: 'Medium', pattern: /(?:maybe|perhaps|possibly|considering|thinking|not sure|decent|okay)/i },
            { level: 'Low', pattern: /(?:not sure|maybe later|not right now|not interested|no thanks|don't think so)/i },
            { level: 'Very Low', pattern: /(?:not at all|never|hate it|terrible|awful|no way|absolutely not)/i }
        ];

        for (const ip of interestPatterns) {
            if (ip.pattern.test(fullText)) {
                return ip.level;
            }
        }

        return null;
    }

    _inferWebsiteStatus(fullText) {
        if (/no website|doesn't have a website|no site|doesn't have a site|no web presence/i.test(fullText)) {
            return 'No Website';
        }
        if (/needs website|wants website|website redesign|new site|current site outdated/i.test(fullText)) {
            return 'Needs Website';
        }
        if (/has a website|current website|existing website|site is live|website is up/i.test(fullText)) {
            return 'Has Website';
        }
        return null;
    }

    // ================================================================
    // SENTIMENT DETECTION
    // ================================================================

    _detectSentiment(fullText) {
        let scores = {
            veryPositive: 0,
            positive: 0,
            neutral: 0,
            negative: 0,
            veryNegative: 0
        };

        // Count sentiment indicators
        for (const [sentiment, pattern] of Object.entries(this.sentimentPatterns)) {
            const matches = (fullText.match(pattern) || []).length;
            scores[sentiment] = matches;
        }

        // Find dominant sentiment
        let maxScore = 0;
        let dominant = 'Neutral';
        for (const [sentiment, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                dominant = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
            }
        }

        // Map to display format
        const sentimentMap = {
            veryPositive: 'Very Positive',
            positive: 'Positive',
            neutral: 'Neutral',
            negative: 'Negative',
            veryNegative: 'Very Negative'
        };

        return sentimentMap[dominant] || 'Neutral';
    }

    // ================================================================
    // OBJECTION DETECTION
    // ================================================================

    _detectObjections(fullText) {
        const objections = [];
        for (const obj of this.objectionPatterns) {
            if (obj.pattern.test(fullText)) {
                const match = fullText.match(obj.pattern);
                if (match) {
                    objections.push({
                        text: match[0].trim(),
                        type: obj.type
                    });
                }
            }
        }
        // Remove duplicates
        const unique = [];
        const seen = new Set();
        for (const obj of objections) {
            if (!seen.has(obj.text)) {
                seen.add(obj.text);
                unique.push(obj);
            }
        }
        return unique;
    }

    // ================================================================
    // TAG DETECTION
    // ================================================================

    _detectTags(fullText) {
        const tags = [];
        for (const [tag, pattern] of Object.entries(this.tagPatterns)) {
            if (pattern.test(fullText)) {
                tags.push(tag);
            }
        }
        return tags;
    }

    // ================================================================
    // QUALITY SCORE CALCULATION
    // ================================================================

    _calculateQualityScore(result, fullText) {
        let score = 5;
        let factors = 0;

        // Check for positive indicators
        if (result.sentiment.value === 'Very Positive') { score += 2; factors++; }
        else if (result.sentiment.value === 'Positive') { score += 1; factors++; }
        else if (result.sentiment.value === 'Negative') { score -= 1; factors++; }
        else if (result.sentiment.value === 'Very Negative') { score -= 2; factors++; }

        // Check for completed fields
        const fields = ['business', 'name', 'phone', 'email', 'date', 'time'];
        for (const field of fields) {
            if (result[field] && result[field].value !== 'N/A' && result[field].confidence > 0.5) {
                score += 0.5;
                factors++;
            }
        }

        // Check for objections handled
        if (result.objections && result.objections.value.length > 0) {
            if (result.objections.value.length < 3) {
                score += 0.5;
            } else {
                score -= 0.5;
            }
            factors++;
        }

        // Check for interest level
        if (result.interestLevel && result.interestLevel.value !== 'N/A') {
            if (result.interestLevel.value === 'Very High' || result.interestLevel.value === 'High') {
                score += 1;
            } else if (result.interestLevel.value === 'Low' || result.interestLevel.value === 'Very Low') {
                score -= 1;
            }
            factors++;
        }

        // Normalize score between 0 and 10
        if (factors > 0) {
            score = score / (factors / 2);
        }
        
        return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
    }

    // ================================================================
    // MISSING INFORMATION DETECTION
    // ================================================================

    _detectMissingInfo(result) {
        const missing = [];
        const criticalFields = [
            { field: 'business', label: 'Business Name' },
            { field: 'name', label: 'Contact Name' },
            { field: 'phone', label: 'Phone Number' },
            { field: 'email', label: 'Email' },
            { field: 'date', label: 'Meeting Date' },
            { field: 'time', label: 'Meeting Time' }
        ];

        for (const cf of criticalFields) {
            if (result[cf.field] && result[cf.field].value === 'N/A') {
                missing.push(cf.label);
            }
        }

        return missing;
    }

    // ================================================================
    // FOLLOW-UP SUGGESTIONS
    // ================================================================

    _generateFollowUpSuggestions(result) {
        const suggestions = [];

        // Based on status
        if (result.status.value === 'Warm Callback') {
            suggestions.push('Schedule follow-up call');
        }
        if (result.status.value === 'Meeting Booked') {
            suggestions.push('Send calendar invite');
            suggestions.push('Prepare meeting materials');
        }
        if (result.status.value === 'Hot Transfer') {
            suggestions.push('Transfer to closer immediately');
        }

        // Based on tags
        if (result.tags && result.tags.value.includes('no_website')) {
            suggestions.push('Prepare website preview');
        }
        if (result.tags && result.tags.value.includes('vip')) {
            suggestions.push('Priority follow-up');
        }

        // Based on missing info
        if (result.missingInformation && result.missingInformation.value.includes('Email')) {
            suggestions.push('Request email address');
        }
        if (result.missingInformation && result.missingInformation.value.includes('Phone Number')) {
            suggestions.push('Confirm phone number');
        }

        // Based on objections
        if (result.objections && result.objections.value.length > 0) {
            suggestions.push('Address objections in follow-up');
        }

        return suggestions.slice(0, 5);
    }

    // ================================================================
    // DEVELOPER NOTES GENERATION
    // ================================================================

    _generateDeveloperNotes(result, fullText) {
        const notes = [];
        const fields = {
            'Business': result.business.value,
            'Contact': result.name.value,
            'Role': result.role.value,
            'Status': result.status.value,
            'Website': result.websiteStatus.value,
            'Interest': result.interestLevel.value,
            'Sentiment': result.sentiment.value
        };

        for (const [label, value] of Object.entries(fields)) {
            if (value && value !== 'N/A') {
                notes.push(`${label}: ${value}`);
            }
        }

        if (result.businessGoals && result.businessGoals.value !== 'N/A') {
            notes.push(`Goals: ${result.businessGoals.value}`);
        }

        if (result.acquisitionMethod && result.acquisitionMethod.value !== 'N/A') {
            notes.push(`Found via: ${result.acquisitionMethod.value}`);
        }

        if (result.objections && result.objections.value.length > 0) {
            notes.push(`Objections: ${result.objections.value.map(o => o.text).join(', ')}`);
        }

        if (result.tags && result.tags.value.length > 0) {
            notes.push(`Tags: ${result.tags.value.join(', ')}`);
        }

        if (result.followUpActions && result.followUpActions.value.length > 0) {
            notes.push(`Follow-up: ${result.followUpActions.value.join(', ')}`);
        }

        if (result.missingInformation && result.missingInformation.value.length > 0) {
            notes.push(`Missing: ${result.missingInformation.value.join(', ')}`);
        }

        if (result.suggestedFollowUp && result.suggestedFollowUp.value.length > 0) {
            notes.push(`Suggested: ${result.suggestedFollowUp.value.join(', ')}`);
        }

        return notes.join('. ');
    }

    // ================================================================
    // CALL SUMMARY GENERATION
    // ================================================================

    _generateCallSummary(result, fullText) {
        const parts = [];
        
        if (result.business.value !== 'N/A') {
            parts.push(`Called ${result.business.value}`);
        } else {
            parts.push('Call');
        }

        if (result.name.value !== 'N/A') {
            parts.push(`spoke with ${result.name.value}`);
        }

        if (result.status.value !== 'N/A') {
            parts.push(`- Outcome: ${result.status.value}`);
        }

        if (result.interestLevel.value !== 'N/A') {
            parts.push(`- Interest: ${result.interestLevel.value}`);
        }

        if (result.objections && result.objections.value.length > 0) {
            parts.push(`- Objections: ${result.objections.value.map(o => o.text).join(', ')}`);
        }

        if (result.followUpActions && result.followUpActions.value.length > 0) {
            parts.push(`- Next: ${result.followUpActions.value.join(', ')}`);
        }

        return parts.join(' ');
    }

    // ================================================================
    // UTILITY METHODS
    // ================================================================

    _formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ================================================================
    // EXPORT TO CRM FORMAT
    // ================================================================

    /**
     * Convert parsed result to appointment format
     * @param {Object} parsed - The parsed result from parse()
     * @returns {Object} Appointment-ready data
     */
    toAppointment(parsed) {
        return {
            business: parsed.business.value,
            contactName: parsed.name.value,
            role: parsed.role.value,
            phone: parsed.phone.value,
            email: parsed.email.value,
            date: parsed.date.value,
            time: parsed.time.value,
            status: parsed.status.value,
            notes: parsed.developerNotes.value,
            tags: parsed.tags.value,
            qualityScore: parsed.meetingQualityScore.value,
            callSummary: parsed.callSummary.value,
            _confidence: {
                business: parsed.business.confidence,
                name: parsed.name.confidence,
                phone: parsed.phone.confidence,
                email: parsed.email.confidence,
                date: parsed.date.confidence,
                time: parsed.time.confidence,
                status: parsed.status.confidence,
                overall: this._calculateOverallConfidence(parsed)
            },
            _metadata: parsed._metadata
        };
    }

    _calculateOverallConfidence(parsed) {
        const fields = ['business', 'name', 'phone', 'email', 'date', 'time'];
        let total = 0;
        let count = 0;
        for (const field of fields) {
            if (parsed[field] && parsed[field].value !== 'N/A') {
                total += parsed[field].confidence;
                count++;
            }
        }
        return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
    }
}

// ================================================================
// EXPOSE GLOBALLY
// ================================================================

// Create singleton instance
const transcriptParser = new TranscriptParser();

// Expose to window
window.TranscriptParser = TranscriptParser;
window.transcriptParser = transcriptParser;

console.log('📝 Transcript Parser initialized');
console.log(`📝 Version: ${transcriptParser.version}`);
console.log(`📝 Confidence threshold: ${transcriptParser.confidenceThreshold}`);