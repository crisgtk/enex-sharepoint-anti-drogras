const fs = require('fs');
const path = 'src/webparts/enexAntiDrogas/components/components/TestForm.tsx';

let content = fs.readFileSync(path, 'utf8');

// replace import
content = content.replace("CheckCircle, XCircle, Search } from 'lucide-react';", "CheckCircle, XCircle, Search, AlertTriangle } from 'lucide-react';");

// replace "Resultado Muestra 1" block to add NO CONCLUYENTE
content = content.replace(
`                        <button
                            type="button"
                            onClick={() => setResultado(1)}
                            className={\`flex-1 p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                        \${resultado === 1
                                    ? 'border-red-600 bg-red-50 text-red-700 shadow-lg ring-2 ring-red-600 ring-opacity-50'
                                    : 'border-gray-200 hover:border-red-600 text-gray-500 hover:bg-red-50'}\`}
                        >
                            <XCircle size={32} />
                            <span className="text-xl font-bold">POSITIVO</span>
                        </button>`,
`                        <button
                            type="button"
                            onClick={() => setResultado(1)}
                            className={\`flex-1 p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                        \${resultado === 1
                                    ? 'border-red-600 bg-red-50 text-red-700 shadow-lg ring-2 ring-red-600 ring-opacity-50'
                                    : 'border-gray-200 hover:border-red-600 text-gray-500 hover:bg-red-50'}\`}
                        >
                            <XCircle size={32} />
                            <span className="text-xl font-bold">POSITIVO</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setResultado(2)}
                            className={\`flex-1 p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                        \${resultado === 2
                                    ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-lg ring-2 ring-orange-500 ring-opacity-50'
                                    : 'border-gray-200 hover:border-orange-500 text-gray-500 hover:bg-orange-50'}\`}
                        >
                            <AlertTriangle size={32} />
                            <span className="text-xl font-bold">NO CONCL.</span>
                        </button>`
);

// replace "Resultado Muestra 2" block to add NO CONCLUYENTE
content = content.replace(
`                            <button
                                type="button"
                                onClick={() => setResultado2(1)}
                                className={\`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                            \${resultado2 === 1
                                        ? 'border-red-600 bg-red-50 text-red-700 shadow-lg ring-2 ring-red-600 ring-opacity-50'
                                        : 'border-gray-200 hover:border-red-600 text-gray-500 hover:bg-red-50'}\`}
                            >
                                <XCircle size={24} />
                                <span className="font-bold">POSITIVO</span>
                            </button>`,
`                            <button
                                type="button"
                                onClick={() => setResultado2(1)}
                                className={\`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                            \${resultado2 === 1
                                        ? 'border-red-600 bg-red-50 text-red-700 shadow-lg ring-2 ring-red-600 ring-opacity-50'
                                        : 'border-gray-200 hover:border-red-600 text-gray-500 hover:bg-red-50'}\`}
                            >
                                <XCircle size={24} />
                                <span className="font-bold">POSITIVO</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setResultado2(2)}
                                className={\`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                            \${resultado2 === 2
                                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-lg ring-2 ring-orange-500 ring-opacity-50'
                                        : 'border-gray-200 hover:border-orange-500 text-gray-500 hover:bg-orange-50'}\`}
                            >
                                <AlertTriangle size={24} />
                                <span className="font-bold">NO CONCL.</span>
                            </button>`
);

fs.writeFileSync(path, content);
console.log('TestForm.tsx updated');
