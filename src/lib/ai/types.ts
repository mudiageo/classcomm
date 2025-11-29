export interface MessageParams {
    scenario: string;
    tone: 'professional' | 'empathetic' | 'firm' | 'celebratory';
    method: 'email' | 'phone' | 'note';
    studentName: string;
    grade: string;
    contactName: string;
    additionalContext?: string;
}

export interface AIProvider {
    generateMessage(params: MessageParams): Promise<{ subject: string; body: string }>;
    // translateMessage(message: string, targetLanguage: string): Promise<string>;
}
