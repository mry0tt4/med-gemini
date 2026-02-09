/**
 * AI Agents Module - Multi-Agent Medical Analysis System
 * 
 * This module exports a workforce of specialized AI agents:
 * 
 * 1. Orchestrator Agent (Gemini 3 Pro)
 *    - Coordinates all other agents
 *    - Compiles final comprehensive reports
 *    - Generates executive summaries
 * 
 * 2. Medical Scan Agent (OpenAI GPT-5 Mini)
 *    - Analyzes medical images with vision capabilities
 *    - Supports X-ray, MRI, CT, Ultrasound, and Dermatology scans
 * 
 * 3. Clinical History Agent (Gemini 3 Flash)
 *    - Analyzes patient medical history
 *    - Identifies risk factors and relevant conditions
 *    - Provides age and gender-specific considerations
 * 
 * 4. Diagnosis Agent (Gemini 3 Pro)
 *    - Synthesizes all available information
 *    - Generates diagnoses with clinical reasoning
 *    - Identifies red flags and urgency levels
 * 
 * 5. Coding Agent (Gemini 3 Flash)
 *    - Generates ICD-10 diagnostic codes
 *    - Generates CPT procedure codes
 */

// Types
export * from "./types";

// Orchestrator - Main coordination agent
export {
    orchestrateFullAnalysis,
    gatherPatientContext,
    analyzeSingleScan,
} from "./orchestrator";

// Scan Agent - Medical image analysis
export {
    analyzeScanWithVision,
    analyzeMultipleScans,
} from "./scan-agent";

// History Agent - Clinical history analysis
export {
    analyzePatientHistory,
    generateLongitudinalSummary,
} from "./history-agent";

// Diagnosis Agent - Diagnostic reasoning
export {
    generateDiagnosis,
    calculateOverallUrgency,
    generateQuickAssessment,
} from "./diagnosis-agent";

// Coding Agent - Medical coding
export {
    generateMedicalCodes,
    generateImagingCodes,
    formatCodesForDisplay,
} from "./coding-agent";
