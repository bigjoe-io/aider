import { Routes, Route } from 'react-router-dom';
import { DocsHome }         from './pages/DocsHome';
import { Introduction }     from './pages/Introduction';
import { QuickstartOwners } from './pages/QuickstartOwners';
import { QuickstartAgents } from './pages/QuickstartAgents';
import { HowItWorks }       from './pages/HowItWorks';
import { AgentPayments }    from './pages/AgentPayments';
import { ApprovalRequests } from './pages/ApprovalRequests';
import { SpendingRules }    from './pages/SpendingRules';
import { RevokeAndPause }   from './pages/RevokeAndPause';
import { AgentToAgent }     from './pages/AgentToAgent';
import { WatchingActivity } from './pages/WatchingActivity';
import { SecurityModel }    from './pages/SecurityModel';
import { Errors }           from './pages/Errors';
import { BestPractices }    from './pages/BestPractices';
import { CliReference }     from './pages/CliReference';
import { SkillMd }          from './pages/SkillMd';
import { ContractReference } from './pages/ContractReference';
import { Glossary }         from './pages/Glossary';

export function DocsRouter() {
  return (
    <Routes>
      <Route index element={<DocsHome />} />
      <Route path="introduction"        element={<Introduction />} />
      <Route path="quickstart-owners"   element={<QuickstartOwners />} />
      <Route path="quickstart-agents"   element={<QuickstartAgents />} />
      <Route path="how-it-works"        element={<HowItWorks />} />
      <Route path="agent-payments"      element={<AgentPayments />} />
      <Route path="approval-requests"   element={<ApprovalRequests />} />
      <Route path="spending-rules"      element={<SpendingRules />} />
      <Route path="revoke-and-pause"    element={<RevokeAndPause />} />
      <Route path="agent-to-agent"      element={<AgentToAgent />} />
      <Route path="watching-activity"   element={<WatchingActivity />} />
      <Route path="security-model"      element={<SecurityModel />} />
      <Route path="errors"              element={<Errors />} />
      <Route path="best-practices"      element={<BestPractices />} />
      <Route path="cli-reference"       element={<CliReference />} />
      <Route path="skill-md"            element={<SkillMd />} />
      <Route path="contract-reference"  element={<ContractReference />} />
      <Route path="glossary"            element={<Glossary />} />
    </Routes>
  );
}
