
import React from 'react';
import { useContent } from '../../hooks/useContent';
import CodeAssistantPanel from '../../components/admin/CodeAssistantPanel';
import { CodeIcon } from '../../components/icons';

const AdminCodeEditorPage: React.FC = () => {
    const { specializedAgents } = useContent();
    const codeAgent = specializedAgents.find(a => a.type === 'code');

    if (!codeAgent) {
        return <div>Error: Code Assistant agent not found in configuration.</div>;
    }

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                <CodeIcon className="w-8 h-8 text-brand-primary" />
                AI Code Assistant
            </h1>
            <CodeAssistantPanel agent={codeAgent} />
        </div>
    );
};

export default AdminCodeEditorPage;
