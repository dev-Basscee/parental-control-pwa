import { ShieldAlert, Download, Terminal, CheckCircle2 } from 'lucide-react'

interface Props {
  onCheckAgain: () => void
  onSkip: () => void
}

export function AgentSetup({ onCheckAgain, onSkip }: Props) {
  const installCommand = 'irm https://knoxs.vercel.app/install-agent.ps1 | iex'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500 rounded-full opacity-10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-500 rounded-full opacity-10 blur-3xl" />
          
          <div className="relative">
            <div className="bg-red-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Agent Not Found</h1>
            <p className="text-indigo-200 max-w-md mx-auto">
              Guardian needs to be installed on this Windows PC to monitor and block applications.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-500" />
              Installation Steps
            </h2>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              
              {/* Step 1 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  1
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-1">Open PowerShell</h3>
                  <p className="text-sm text-slate-500">Right-click the Start button and select <strong>Windows PowerShell (Admin)</strong> or Terminal (Admin).</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  2
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-2">Run Installer</h3>
                  <p className="text-sm text-slate-500 mb-3">Copy and paste this command, then press Enter:</p>
                  
                  <div className="relative group/copy">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Terminal className="w-4 h-4 text-slate-400" />
                    </div>
                    <input 
                      readOnly 
                      value={installCommand}
                      className="w-full bg-slate-800 text-slate-200 text-sm font-mono py-2.5 pl-9 pr-12 rounded-lg border border-slate-700 outline-none selection:bg-indigo-500/50"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button 
                      onClick={() => navigator.clipboard.writeText(installCommand)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-900 mb-1">What happens next?</h4>
              <p className="text-sm text-emerald-700/80 leading-relaxed">
                The script will download Guardian, install Node.js if needed, and set up background services that start automatically on boot. 
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 space-y-3">
          <button 
            onClick={onCheckAgain}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5"
          >
            I've run the installer — Check Again
          </button>
          <button 
            onClick={onSkip}
            className="w-full bg-white hover:bg-slate-100 text-slate-600 font-medium py-3 rounded-xl transition-all border border-slate-200"
          >
            Skip for now — View Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}
