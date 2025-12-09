import React from 'react';
import { SpecializedAgent } from '../../types';

interface CodeAssistantPanelProps {
    agent: SpecializedAgent;
}

const CodeAssistantPanel: React.FC<CodeAssistantPanelProps> = ({ agent }) => {
    return (
        <div className="flex-grow flex flex-col bg-brand-dark p-4 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-4">Code Assistant: {agent.name}</h3>
            <div className="flex-grow flex items-center justify-center text-brand-text-secondary">
                <p>(Code Assistant Panel UI is under construction)</p>
            </div>
            <div className="mt-4 p-4 border border-dashed border-brand-surface rounded-lg text-sm text-brand-text-secondary">
                <p className="font-bold mb-2">Instructions:</p>
                <p>To use the full code assistant, please provide the file context and your request in the main panel.</p>
            </div>
        </div>
    );
};

export default CodeAssistantPanel;
