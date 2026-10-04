const fs = require('fs');
const file = 'src/components/common/PanPortfolioSyncModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = <DownloadCloud className="w-4 h-4" />
                  <span>1-Click Open CAMS CAS Request Form</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRequestCamsOnline('MFCENTRAL')}
                  disabled={isLoading}
                  className={\w-full py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer \\}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Request from MF Central (Live Mobile OTP)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </button>;

const replacement = <DownloadCloud className="w-4 h-4" />
                  <span>1-Click Open CAMS (Mutual Funds)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRequestCamsOnline('NSDL')}
                  disabled={isLoading}
                  className={\w-full py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer \\}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>NSDL e-CAS (Equity Shares & MFs)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRequestCamsOnline('MFCENTRAL')}
                    disabled={isLoading}
                    className={\py-2.5 rounded-xl text-[10px] sm:text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer \\}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>MF Central</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRequestCamsOnline('CDSL')}
                    disabled={isLoading}
                    className={\py-2.5 rounded-xl text-[10px] sm:text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer \\}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    <span>CDSL e-CAS</span>
                  </button>
                </div>;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Replaced buttons!');
