/**
 * OpenCog Integration Diagnostics System
 * Phase 1: Interface Stabilization & Cognitive Surface Coupling
 *
 * Provides comprehensive logging, monitoring, and diagnostic capabilities
 * for the OpenCog integration system.
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Diagnostic levels for different types of monitoring
 */
export const DiagnosticLevel = {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    CRITICAL: 5,
};

/**
 * Integration phases for tracking progress
 */
export const IntegrationPhase = {
    PHASE_1_STABILIZATION: 'phase_1_stabilization',
    PHASE_2_MIGRATION: 'phase_2_migration',
    PHASE_3_REFACTORING: 'phase_3_refactoring',
    PHASE_4_SYNERGY: 'phase_4_synergy',
};

/**
 * OpenCog Integration Diagnostics Manager
 */
export class OpenCogDiagnostics {
    constructor(options = {}) {
        this.logLevel = options.logLevel || DiagnosticLevel.INFO;
        this.enableFileLogging = options.enableFileLogging || false;
        this.logDirectory = options.logDirectory || './logs/opencog';
        this.currentPhase = options.currentPhase || IntegrationPhase.PHASE_1_STABILIZATION;
        this.sessionId = this.generateSessionId();

        // Performance tracking
        this.performanceMetrics = {
            responseTimings: [],
            connectionAttempts: [],
            errorCounts: {},
            cognitiveProcessingTimes: [],
        };

        // Phase tracking
        this.phaseProgress = {
            [IntegrationPhase.PHASE_1_STABILIZATION]: {
                started: Date.now(),
                completed: false,
                milestones: [],
            },
        };

        this.initializeLogging();
    }

    /**
     * Initialize logging infrastructure
     */
    initializeLogging() {
        if (this.enableFileLogging) {
            try {
                if (!existsSync(this.logDirectory)) {
                    mkdirSync(this.logDirectory, { recursive: true });
                }

                const logFile = join(this.logDirectory, `opencog-${this.sessionId}.log`);
                const diagnosticFile = join(this.logDirectory, `diagnostics-${this.sessionId}.json`);

                this.logFile = logFile;
                this.diagnosticFile = diagnosticFile;

                // Initialize with session header
                this.log(DiagnosticLevel.INFO, 'SYSTEM', 'OpenCog Diagnostics Session Started', {
                    sessionId: this.sessionId,
                    phase: this.currentPhase,
                    timestamp: new Date().toISOString(),
                });

            } catch (error) {
                console.warn('Failed to initialize file logging:', error.message);
                this.enableFileLogging = false;
            }
        }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `opencog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Log message with specified level
     */
    log(level, component, message, data = {}) {
        if (level < this.logLevel) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            level: this.getLevelName(level),
            component,
            message,
            sessionId: this.sessionId,
            phase: this.currentPhase,
            data: data || {},
        };

        // Console output
        const consoleMethod = this.getConsoleMethod(level);
        const formattedMessage = `[${logEntry.timestamp}] [${logEntry.level}] [${component}] ${message}`;
        consoleMethod(formattedMessage, Object.keys(data).length > 0 ? data : '');

        // File logging
        if (this.enableFileLogging && this.logFile) {
            try {
                appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
            } catch (error) {
                console.warn('Failed to write to log file:', error.message);
            }
        }
    }

    /**
     * Track API call performance
     */
    trackApiCall(method, startTime, endTime, success, error = null) {
        const duration = endTime - startTime;

        const apiCallData = {
            method,
            duration,
            success,
            error: error ? error.message : null,
            timestamp: new Date().toISOString(),
        };

        this.performanceMetrics.responseTimings.push(apiCallData);

        this.log(
            success ? DiagnosticLevel.DEBUG : DiagnosticLevel.WARN,
            'API_PERFORMANCE',
            `${method} completed in ${duration}ms`,
            apiCallData,
        );

        // Alert on slow responses
        if (duration > 5000) {
            this.log(DiagnosticLevel.WARN, 'PERFORMANCE', `Slow API response detected: ${method} took ${duration}ms`);
        }
    }

    /**
     * Track connection attempts and results
     */
    trackConnection(endpoint, port, success, error = null) {
        const connectionData = {
            endpoint,
            port,
            success,
            error: error ? error.message : null,
            timestamp: new Date().toISOString(),
        };

        this.performanceMetrics.connectionAttempts.push(connectionData);

        this.log(
            success ? DiagnosticLevel.INFO : DiagnosticLevel.ERROR,
            'CONNECTION',
            `Connection to ${endpoint}:${port} ${success ? 'succeeded' : 'failed'}`,
            connectionData,
        );
    }

    /**
     * Track cognitive processing metrics
     */
    trackCognitiveProcessing(inputLength, outputLength, confidence, processingTime, concepts) {
        const cognitiveData = {
            inputLength,
            outputLength,
            confidence,
            processingTime,
            conceptsActivated: concepts ? concepts.length : 0,
            timestamp: new Date().toISOString(),
        };

        this.performanceMetrics.cognitiveProcessingTimes.push(cognitiveData);

        this.log(DiagnosticLevel.DEBUG, 'COGNITIVE', 'Cognitive processing completed', cognitiveData);

        // Alert on low confidence
        if (confidence < 0.3) {
            this.log(DiagnosticLevel.WARN, 'COGNITIVE', `Low confidence response: ${confidence}`);
        }
    }

    /**
     * Track phase milestone completion
     */
    trackPhaseMilestone(milestone, completed = true, data = {}) {
        const milestoneData = {
            milestone,
            completed,
            timestamp: new Date().toISOString(),
            data,
        };

        if (this.phaseProgress[this.currentPhase]) {
            this.phaseProgress[this.currentPhase].milestones.push(milestoneData);
        }

        this.log(
            DiagnosticLevel.INFO,
            'PHASE_TRACKING',
            `Milestone ${completed ? 'completed' : 'started'}: ${milestone}`,
            milestoneData,
        );
    }

    /**
     * Generate diagnostic report
     */
    generateDiagnosticReport() {
        const report = {
            sessionId: this.sessionId,
            currentPhase: this.currentPhase,
            generatedAt: new Date().toISOString(),

            // Performance summary
            performance: {
                averageResponseTime: this.calculateAverageResponseTime(),
                successRate: this.calculateSuccessRate(),
                totalApiCalls: this.performanceMetrics.responseTimings.length,
                connectionSuccessRate: this.calculateConnectionSuccessRate(),
            },

            // Cognitive metrics
            cognitive: {
                averageConfidence: this.calculateAverageConfidence(),
                totalProcessingEvents: this.performanceMetrics.cognitiveProcessingTimes.length,
                averageConceptsActivated: this.calculateAverageConceptsActivated(),
            },

            // Phase progress
            phaseProgress: this.phaseProgress,

            // Error summary
            errors: this.generateErrorSummary(),
        };

        this.log(DiagnosticLevel.INFO, 'DIAGNOSTICS', 'Generated diagnostic report', report);

        // Save to file if enabled
        if (this.enableFileLogging && this.diagnosticFile) {
            try {
                writeFileSync(this.diagnosticFile, JSON.stringify(report, null, 2));
            } catch (error) {
                this.log(DiagnosticLevel.WARN, 'DIAGNOSTICS', 'Failed to save diagnostic report', { error: error.message });
            }
        }

        return report;
    }

    /**
     * Helper methods for calculations
     */
    calculateAverageResponseTime() {
        if (this.performanceMetrics.responseTimings.length === 0) return 0;
        const total = this.performanceMetrics.responseTimings.reduce((sum, timing) => sum + timing.duration, 0);
        return total / this.performanceMetrics.responseTimings.length;
    }

    calculateSuccessRate() {
        if (this.performanceMetrics.responseTimings.length === 0) return 1;
        const successful = this.performanceMetrics.responseTimings.filter(timing => timing.success).length;
        return successful / this.performanceMetrics.responseTimings.length;
    }

    calculateConnectionSuccessRate() {
        if (this.performanceMetrics.connectionAttempts.length === 0) return 1;
        const successful = this.performanceMetrics.connectionAttempts.filter(attempt => attempt.success).length;
        return successful / this.performanceMetrics.connectionAttempts.length;
    }

    calculateAverageConfidence() {
        if (this.performanceMetrics.cognitiveProcessingTimes.length === 0) return 0;
        const total = this.performanceMetrics.cognitiveProcessingTimes.reduce((sum, proc) => sum + proc.confidence, 0);
        return total / this.performanceMetrics.cognitiveProcessingTimes.length;
    }

    calculateAverageConceptsActivated() {
        if (this.performanceMetrics.cognitiveProcessingTimes.length === 0) return 0;
        const total = this.performanceMetrics.cognitiveProcessingTimes.reduce((sum, proc) => sum + proc.conceptsActivated, 0);
        return total / this.performanceMetrics.cognitiveProcessingTimes.length;
    }

    generateErrorSummary() {
        const errorSummary = {};

        // Collect errors from response timings
        this.performanceMetrics.responseTimings
            .filter(timing => !timing.success && timing.error)
            .forEach(timing => {
                errorSummary[timing.error] = (errorSummary[timing.error] || 0) + 1;
            });

        // Collect errors from connection attempts
        this.performanceMetrics.connectionAttempts
            .filter(attempt => !attempt.success && attempt.error)
            .forEach(attempt => {
                errorSummary[attempt.error] = (errorSummary[attempt.error] || 0) + 1;
            });

        return errorSummary;
    }

    /**
     * Utility methods
     */
    getLevelName(level) {
        const levelNames = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
        return levelNames[level] || 'UNKNOWN';
    }

    getConsoleMethod(level) {
        if (level >= DiagnosticLevel.ERROR) return console.error;
        if (level >= DiagnosticLevel.WARN) return console.warn;
        if (level >= DiagnosticLevel.INFO) return console.info;
        return console.log;
    }

    /**
     * Set current integration phase
     */
    setPhase(phase) {
        if (this.phaseProgress[this.currentPhase]) {
            this.phaseProgress[this.currentPhase].completed = true;
        }

        this.currentPhase = phase;

        if (!this.phaseProgress[phase]) {
            this.phaseProgress[phase] = {
                started: Date.now(),
                completed: false,
                milestones: [],
            };
        }

        this.log(DiagnosticLevel.INFO, 'PHASE_TRACKING', `Entered phase: ${phase}`);
    }
}

/**
 * Create a global diagnostics instance
 */
export function createDiagnostics(options = {}) {
    return new OpenCogDiagnostics(options);
}
