import type { Student, Contact } from '$lib/db';

export interface VariableContext {
    student?: Student;
    contact?: Contact;
    teacherName: string;
    schoolName: string;
}

export function replaceVariables(text: string, context: VariableContext): string {
    let result = text;

    // Student variables
    if (context.student) {
        result = result
            .replace(/\{\{studentName\}\}/g, context.student.firstName)
            .replace(/\{\{studentFullName\}\}/g, `${context.student.firstName} ${context.student.lastName}`)
            .replace(/\{\{grade\}\}/g, context.student.grade)
            .replace(/\{\{class\}\}/g, context.student.class || '');
    }

    // Contact variables
    if (context.contact) {
        result = result
            .replace(/\{\{parentName\}\}/g, context.contact.name)
            .replace(/\{\{contactName\}\}/g, context.contact.name);
    }

    // Teacher/School variables
    result = result
        .replace(/\{\{teacherName\}\}/g, context.teacherName)
        .replace(/\{\{schoolName\}\}/g, context.schoolName)
        .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
        .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());

    return result;
}

export function getAvailableVariables(): string[] {
    return [
        '{{studentName}}',
        '{{studentFullName}}',
        '{{grade}}',
        '{{class}}',
        '{{parentName}}',
        '{{contactName}}',
        '{{teacherName}}',
        '{{schoolName}}',
        '{{date}}',
        '{{time}}'
    ];
}
