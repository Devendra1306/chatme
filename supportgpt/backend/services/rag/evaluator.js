/**
 * RAG Evaluator Service
 * Evaluates groundedness, detects hallucinations, computes confidence
 */

/**
 * Evaluate if response is grounded in the provided context
 * @param {string} response - Generated AI response
 * @param {Array<{content}>} context - Retrieved context chunks
 * @returns {{score: number, isGrounded: boolean, hallucinations: string[]}}
 */
export function evaluateGroundedness(response, context) {
  if (!response || !context || context.length === 0) {
    return {
      score: 0,
      isGrounded: false,
      hallucinations: [],
      explanation: 'No context provided for grounding evaluation',
    };
  }

  const responseLower = response.toLowerCase();
  const contextTexts = context.map((c) => (c.content || '').toLowerCase()).join(' ');

  // Extract key claims/statements from response
  const claims = extractClaims(response);

  let groundedClaims = 0;
  const hallucinations = [];

  for (const claim of claims) {
    const claimTerms = tokenize(claim);
    if (claimTerms.length < 3) {
      groundedClaims++; // Too short to evaluate — assume grounded
      continue;
    }

    // Check if claim terms are present in context
    const matchingTerms = claimTerms.filter((term) => contextTexts.includes(term));
    const coverageRatio = matchingTerms.length / claimTerms.length;

    if (coverageRatio >= 0.5) {
      groundedClaims++;
    } else {
      hallucinations.push(claim.substring(0, 100));
    }
  }

  const score = claims.length > 0 ? groundedClaims / claims.length : 0.5;
  const isGrounded = score >= 0.6;

  return {
    score: Math.round(score * 100) / 100,
    isGrounded,
    hallucinations,
    groundedClaims,
    totalClaims: claims.length,
    explanation: isGrounded
      ? `Response is well-grounded (${groundedClaims}/${claims.length} claims supported)`
      : `Response may contain unsupported claims (${claims.length - groundedClaims}/${claims.length} not grounded)`,
  };
}

/**
 * Detect potential hallucinations in the response
 * @param {string} response
 * @param {Array<{content}>} context
 * @returns {{hallucinationDetected: boolean, confidence: number, suspiciousStatements: string[]}}
 */
export function detectHallucination(response, context) {
  if (!response) {
    return { hallucinationDetected: false, confidence: 1.0, suspiciousStatements: [] };
  }

  const contextTexts = (context || []).map((c) => c.content || '').join(' ').toLowerCase();
  const suspiciousStatements = [];

  // Patterns that might indicate hallucination
  const hallucintationPatterns = [
    // Specific numbers/dates not in context
    /\b(\d{4,})\b/g,  // Large numbers
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    // Definitive claims
    /\b(always|never|100%|guaranteed|definitely|certainly|absolutely)\b/gi,
    // Specific version numbers or product names in quotes
    /version\s+[\d.]+/gi,
  ];

  const responseLines = response.split('. ');

  for (const line of responseLines) {
    if (line.trim().length < 20) continue;

    const lineLower = line.toLowerCase();
    const lineTerms = tokenize(line);

    // Check keyword coverage against context
    const contextTerms = new Set(tokenize(contextTexts));
    const coveredTerms = lineTerms.filter((t) => contextTerms.has(t));
    const coverage = lineTerms.length > 0 ? coveredTerms.length / lineTerms.length : 1;

    // Check for patterns that suggest hallucination
    const hasHallucinationPattern = hallucintationPatterns.some((pattern) => pattern.test(line));

    if (coverage < 0.2 && hasHallucinationPattern && lineTerms.length > 5) {
      suspiciousStatements.push(line.trim().substring(0, 150));
    }
  }

  const hallucinationDetected = suspiciousStatements.length > 0;
  const confidence = hallucinationDetected
    ? Math.max(0.3, 1 - suspiciousStatements.length * 0.15)
    : 0.9;

  return {
    hallucinationDetected,
    confidence,
    suspiciousStatements,
    checkedStatements: responseLines.length,
  };
}

/**
 * Compute overall confidence score combining retrieval and generation quality
 * @param {number} retrieverScore - Average retrieval similarity score (0-1)
 * @param {number} generatorScore - Groundedness score (0-1)
 * @param {number} rerankScore - Reranker confidence (0-1)
 * @returns {number} Combined confidence (0-1)
 */
export function computeConfidence(retrieverScore = 0, generatorScore = 0, rerankScore = 0) {
  // Weighted combination
  const weights = {
    retrieval: 0.35,
    generation: 0.40,
    rerank: 0.25,
  };

  const confidence = (
    retrieverScore * weights.retrieval +
    generatorScore * weights.generation +
    rerankScore * weights.rerank
  );

  return Math.min(Math.max(Math.round(confidence * 100) / 100, 0), 1);
}

/**
 * Full evaluation pipeline
 * @param {string} response
 * @param {Array} context
 * @param {number} retrieverScore
 * @param {number} rerankScore
 * @returns {object} Complete evaluation results
 */
export function evaluate(response, context, retrieverScore = 0, rerankScore = 0) {
  const groundedness = evaluateGroundedness(response, context);
  const hallucination = detectHallucination(response, context);
  const confidence = computeConfidence(retrieverScore, groundedness.score, rerankScore);

  return {
    groundedness,
    hallucination,
    confidence,
    summary: {
      isGrounded: groundedness.isGrounded,
      hallucinationDetected: hallucination.hallucinationDetected,
      overallConfidence: confidence,
      quality: getQualityLabel(confidence),
    },
  };
}

/**
 * Extract sentences/claims from response text
 */
function extractClaims(text) {
  // Split by sentences
  const sentences = text
    .replace(/\n+/g, ' ')
    .match(/[^.!?]+[.!?]+/g) || [text];

  return sentences
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 500);
}

/**
 * Tokenize into meaningful terms
 */
function tokenize(text) {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'and', 'or',
    'but', 'not', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you',
  ]);

  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopWords.has(t));
}

/**
 * Get quality label from confidence score
 */
function getQualityLabel(confidence) {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  if (confidence >= 0.4) return 'low';
  return 'very-low';
}

export default { evaluateGroundedness, detectHallucination, computeConfidence, evaluate };
