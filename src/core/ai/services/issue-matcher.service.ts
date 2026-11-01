import { Injectable } from '@nestjs/common';

interface MatchableIssue {
    symptom: string;
    cause?: string;
    fix: string;
    severity?: unknown;
}

@Injectable()
export class IssueMatcherService {
    /**
     * Finds the most relevant recipe issue for a user message.
     *
     * @param issues - Recipe issues
     * @param text - User message
     * @returns The best matching issue or null
     */
    findMatch<T extends MatchableIssue>(issues: T[], text: string): T | null {
        const userWords = this.words(text);

        if (userWords.length === 0) {
            return null;
        }

        let bestIssue: T | null = null;
        let bestScore = 0;

        for (const issue of issues) {
            const issueWords = this.words(
                `${issue.symptom} ${issue.cause ?? ''}`,
            );

            if (issueWords.length === 0) {
                continue;
            }

            const matched = issueWords.filter((issueWord) =>
                userWords.some(
                    (userWord) =>
                        issueWord.includes(userWord) ||
                        userWord.includes(issueWord),
                ),
            ).length;
            const score = matched / issueWords.length;

            if (score > bestScore) {
                bestScore = score;
                bestIssue = issue;
            }
        }

        return bestScore >= 0.5 ? bestIssue : null;
    }

    /**
     * Normalizes text into meaningful words.
     *
     * @param value - Raw text
     * @returns Lowercase accent-free words
     */
    private words(value: string): string[] {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .split(/\s+/)
            .filter((word) => word.length > 2);
    }
}
