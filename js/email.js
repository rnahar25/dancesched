// Email module - Gmail API operations

const EMAIL_ENDPOINT = 'https://gmail-function.vercel.app/api/send-email';

export class EmailService {
    async send(payload) {
        try {
            const response = await fetch(EMAIL_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    timestamp: new Date().toISOString(),
                    source: 'Dance Schedule Website'
                })
            });
            return response.ok;
        } catch (e) {
            console.error('Email error:', e);
            return false;
        }
    }

    sendApproval(classData, action = 'add') {
        return this.send({
            type: 'class_approval',
            action,
            classData,
            approvalToken: classData.approvalToken,
            ...(action === 'edit' && { originalData: classData.originalData })
        });
    }

    sendSuggestion(message) {
        return this.send({ type: 'suggestion', message });
    }
}
