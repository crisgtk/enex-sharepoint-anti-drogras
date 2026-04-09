import React, { useState } from 'react';
import { User, FileText, CheckCircle, XCircle, Search } from 'lucide-react';
import Combobox from './Combobox';

const formatRut = (rut) => {
    // Basic formatting XXX.XXX.XXX-X
    const clean = rut.replace(/[^0-9kK]/g, '');
    if (clean.length < 2) return clean;

    // Split body and verifier
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();

    // Format body with dots
    let formattedBody = '';
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
        if (j > 0 && j % 3 === 0) formattedBody = '.' + formattedBody;
        formattedBody = body[i] + formattedBody;
    }

    return `${formattedBody}-${dv}`;
};

export const TEST_OPERATORS = [
    "JOSE JEREMIAS ACEVEDO HENRIQUEZ",
    "DANIEL ALEJANDRO CALBUL CORREA",
    "CID CIPRES DANIEL RAMON",
    "JOSE DANIEL HERNANDEZ CORNEJO",
    "HERNAN FELIPE MARIN LATORRE",
    "SARA CAMILA MARTINEZ BAEZA",
    "CRISTIAN ANTONIO VASQUEZ ARAUNA",
    "MARIELA MUNOZ SEPULVEDA"
];

const TestForm = ({ tipoTest, onSubmit, initialData = null as any, isEdit = false }: any) => {
    const isRegistroMode = tipoTest === 'registro';
    const [selectedType, setSelectedType] = useState(initialData?.tipo_test || 'alcohol'); // Default for registro mode

    const [formData, setFormData] = useState({
        rut: initialData?.rut || '',
        categoria_persona: (initialData?.categoria_persona === 'Planta vinculada a empresa ENEX' ? 'Planta' : initialData?.categoria_persona) || 'Planta',
        empresa: initialData?.empresa || ((!initialData || initialData.categoria_persona === 'Planta' || initialData.categoria_persona === 'Planta vinculada a empresa ENEX') ? 'Enex' : ''),
        cargo: initialData?.cargo || '',
        nombre: initialData?.nombre || '',
        numero_maquina: initialData?.numero_maquina || '',
        serial_equipo: initialData?.serial_equipo || '', // Ensure field exists
        usuario_operador: initialData?.usuario_operador || '',
    });

    const [resultado, setResultado] = useState(initialData !== null ? initialData.resultado_1 : null);

    const handleSearchRut = async () => {
        if (!formData.rut) return;

        // Format RUT first
        const formatted = formatRut(formData.rut);
        setFormData(prev => ({ ...prev, rut: formatted }));

        try {
            const subject = await window.api.searchRut(formatted);
            if (subject) {
                // Auto-fill fields
                setFormData(prev => ({
                    ...prev,
                    rut: formatted,
                    nombre: subject.nombre,
                    categoria_persona: subject.categoria_persona === 'Planta vinculada a empresa ENEX' ? 'Planta' : subject.categoria_persona,
                    empresa: (subject.categoria_persona === 'Planta vinculada a empresa ENEX' || subject.categoria_persona === 'Planta') ? 'Enex' : (subject.empresa || ''),
                    cargo: subject.cargo || ''
                }));
            } else {
                // Optional: alert('Usuario no encontrado');
            }
        } catch (err) {
            console.error("Search error:", err);
        }
    };

    const [resultado2, setResultado2] = useState(initialData?.resultado_2 !== undefined ? initialData.resultado_2 : null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (resultado === null) {
            alert("Selecciona un resultado");
            return;
        }
        const finalType = isRegistroMode ? selectedType : tipoTest;

        // Ensure RUT is formatted
        const formattedRut = formatRut(formData.rut);

        const submissionData: any = {
            ...formData,
            rut: formattedRut,
            tipo_test: finalType,
            resultado_1: resultado
        };

        if (isEdit && resultado2 !== null) {
            submissionData.resultado_2 = resultado2;
        }

        onSubmit(submissionData);

        // Reset form
        setFormData({ 
            ...formData, 
            rut: '', 
            nombre: '', 
            numero_maquina: '', 
            serial_equipo: '', 
            empresa: formData.categoria_persona === 'Planta' ? 'Enex' : '', 
            cargo: '' 
        });
        setResultado(null);
        setResultado2(null);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 capitalize text-enex-blue">
                <FileText className="w-6 h-6" />
                {isEdit ? 'Actualizar Registro' : (isRegistroMode ? 'Registro de Usuario / Test' : `Nuevo Test de ${tipoTest}`)}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 z-20 relative">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Responsable de la Toma (Operador)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <User className="absolute left-3 top-2.5 text-gray-400 z-10" size={20} />
                            <Combobox
                                options={TEST_OPERATORS}
                                value={formData.usuario_operador}
                                onChange={(val: any) => setFormData({ ...formData, usuario_operador: val })}
                                placeholder="Seleccione o escriba quien realiza el test..."
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-enex-blue focus:ring-enex-blue border p-2 pl-10 h-10"
                                required={true}
                            />
                        </div>
                    </div>
                </div>
                {isRegistroMode && (
                    <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Seleccionar Tipo de Test</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="testType"
                                    value="alcohol"
                                    checked={selectedType === 'alcohol'}
                                    onChange={() => setSelectedType('alcohol')}
                                    className="text-enex-blue focus:ring-enex-blue"
                                />
                                <span className="text-enex-blue font-semibold">Alcohol</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="testType"
                                    value="droga"
                                    checked={selectedType === 'droga'}
                                    onChange={() => setSelectedType('droga')}
                                    className="text-enex-blue focus:ring-enex-blue"
                                />
                                <span className="text-enex-blue font-semibold">Droga</span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">RUT</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                required
                                value={formData.rut}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9kK]/g, '');
                                    setFormData({ ...formData, rut: val });
                                }}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-enex-blue focus:ring-enex-blue border p-2"
                                placeholder="123456789"
                            />
                            <button
                                type="button"
                                onClick={handleSearchRut}
                                className="bg-enex-blue text-white p-2 rounded-md hover:bg-blue-900 transition-colors shadow-sm"
                                title="Buscar RUT"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            required
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-enex-blue focus:ring-enex-blue border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Número de Test</label>
                        <input
                            type="text"
                            required
                            value={formData.serial_equipo}
                            onChange={(e) => setFormData({ ...formData, serial_equipo: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-enex-blue focus:ring-enex-blue border p-2"
                            placeholder="N° de Test"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Cargo</label>
                        <input
                            type="text"
                            value={formData.cargo}
                            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-enex-blue focus:ring-enex-blue border p-2"
                            placeholder="Cargo del trabajador"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                        <select
                            value={formData.categoria_persona}
                            onChange={(e) => {
                                const cat = e.target.value;
                                setFormData(prev => ({
                                    ...prev,
                                    categoria_persona: cat,
                                    empresa: cat === 'Planta' ? 'Enex' : ''
                                }));
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-enex-blue focus:ring-enex-blue border p-2"
                        >
                            <option value="Planta">Planta</option>
                            <option value="Transportista">Transportista</option>
                            <option value="Externo">Externo</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Empresa</label>
                        <input
                            type="text"
                            value={formData.empresa || ''}
                            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                            readOnly={formData.categoria_persona === 'Planta'}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-enex-blue focus:ring-enex-blue border p-2 ${
                                formData.categoria_persona === 'Planta' ? 'bg-gray-100 cursor-not-allowed text-gray-500 font-semibold text-opacity-80' : ''
                            }`}
                            placeholder="Nombre Empresa"
                        />
                    </div>

                    {formData.categoria_persona === 'Transportista' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Número Máquina (Patente)</label>
                            <input
                                type="text"
                                value={formData.numero_maquina}
                                onChange={(e) => setFormData({ ...formData, numero_maquina: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-enex-blue focus:ring-enex-blue border p-2"
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resultado Muestra 1</label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setResultado(0)}
                            className={`flex-1 p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                        ${resultado === 0
                                    ? 'border-enex-green bg-green-50 text-enex-green shadow-lg ring-2 ring-enex-green ring-opacity-50'
                                    : 'border-gray-200 hover:border-enex-green text-gray-500 hover:bg-green-50'}`}
                        >
                            <CheckCircle size={32} />
                            <span className="text-xl font-bold">NEGATIVO</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setResultado(1)}
                            className={`flex-1 p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                        ${resultado === 1
                                    ? 'border-red-600 bg-red-50 text-red-700 shadow-lg ring-2 ring-red-600 ring-opacity-50'
                                    : 'border-gray-200 hover:border-red-600 text-gray-500 hover:bg-red-50'}`}
                        >
                            <XCircle size={32} />
                            <span className="text-xl font-bold">POSITIVO</span>
                        </button>
                    </div>
                </div>

                {/* Show Second Sample if editing and it exists or implied by flow (though History usually shows completed, user asked to edit both) */}
                {isEdit && (initialData?.fecha_hora_2 || initialData?.resultado_2 !== undefined) && (
                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Resultado Muestra 2 (Confirmación)</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setResultado2(0)}
                                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                            ${resultado2 === 0
                                        ? 'border-enex-green bg-green-50 text-enex-green shadow-lg ring-2 ring-enex-green ring-opacity-50'
                                        : 'border-gray-200 hover:border-enex-green text-gray-500 hover:bg-green-50'}`}
                            >
                                <CheckCircle size={24} />
                                <span className="font-bold">NEGATIVO</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setResultado2(1)}
                                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                            ${resultado2 === 1
                                        ? 'border-red-600 bg-red-50 text-red-700 shadow-lg ring-2 ring-red-600 ring-opacity-50'
                                        : 'border-gray-200 hover:border-red-600 text-gray-500 hover:bg-red-50'}`}
                            >
                                <XCircle size={24} />
                                <span className="font-bold">POSITIVO</span>
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-enex-blue text-white py-3 px-4 rounded-md hover:bg-blue-900 font-bold text-lg mt-6 shadow-lg transition-colors"
                >
                    {isEdit ? 'Actualizar' : 'Guardar Test'}
                </button>
            </form>
        </div>
    );
};

export default TestForm;
