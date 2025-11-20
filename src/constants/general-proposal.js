export const getGeneralProposal = (proposal, clientName = '') => {
    const greeting = clientName ? `Hey ${clientName}, \n` : `Hey, how are you?\n`;
    return `
${greeting}
${proposal}
    `;
};