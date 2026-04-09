import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

const PendingList = ({ onUpdate }: any) => {
    const [pendientes, setPendientes] = useState<any[]>([]);

    const loadPendientes = async () => {
        try {
            const data = await window.api.getPending();
            setPendientes(data);
        } catch (error) {
            console.error("Error loading pending:", error);
        }
    };

    useEffect(() => {
        loadPendientes();
    }, []);

    const handleComplete = async (id: any, resultado2: any) => {
        if (confirm(`¿Confirmar resultado de segunda muestra: ${resultado2 ? 'POSITIVO' : 'NEGATIVO'}?`)) {
            await window.api.updateTestResult2({ id, resultado_2: resultado2 });
            loadPendientes();
            if (onUpdate) onUpdate();
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-enex-blue">
                <AlertTriangle className="text-orange-500" />
                Tests Pendientes (Segunda Muestra Requerida)
            </h2>

            {pendientes.length === 0 ? (
                <p className="text-gray-500 italic">No hay tests pendientes.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">1a Muestra</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción (2a Muestra)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pendientes.map((test: any) => (
                                <tr key={test.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(test.fecha_hora_1).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{test.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.rut}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{test.tipo_test}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${test.resultado_1 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {test.resultado_1 ? 'Positivo' : 'Negativo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                        <button
                                            onClick={() => handleComplete(test.id, 0)}
                                            className="bg-enex-green hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded text-xs flex items-center gap-1 shadow-md transition-all hover:scale-105 active:scale-95 hover:shadow-lg"
                                        >
                                            <Check size={14} /> Negativo
                                        </button>
                                        <button
                                            onClick={() => handleComplete(test.id, 1)}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded text-xs flex items-center gap-1 shadow-md transition-all hover:scale-105 active:scale-95 hover:shadow-lg"
                                        >
                                            <X size={14} /> Positivo
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PendingList;
