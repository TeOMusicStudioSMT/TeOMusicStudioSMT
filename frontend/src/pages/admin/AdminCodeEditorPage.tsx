import React from 'react';
import { SPECIALIZED_AGENTS } from '../../constants';
import CodeAssistantPanel from '../../components/admin/CodeAssistantPanel';
import { CodeIcon } from '../../components/icons';

const AdminCodeEditorPage: React.FC = () => {
    // FIX: Source agent directly from constants to ensure this tool always works,
    // even if the dynamic agent configuration in the context is empty.
    const codeAgent = SPECIALIZED_AGENTS.find(a => a.type === 'code');

    if (!codeAgent) {
        return <div>Error: Code Assistant agent not found in the application's constants.</div>;
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