import React, { useEffect, useState } from 'react';
import { FileText, Database, Printer, FileDown, Edit, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TestForm, { TEST_OPERATORS } from './TestForm';
import Combobox from './Combobox';

const displayCategory = (cat: any) => cat === 'Planta vinculada a empresa ENEX' ? 'Planta' : cat;

const History = ({ onUpdate }: any) => {
    const [history, setHistory] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [editingTest, setEditingTest] = useState<any>(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        type: 'all',
        result: 'all',
        searchName: '',
        searchRut: '',
        searchEmpresa: '',
        searchOperador: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const RECORDS_PER_PAGE = 10;

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const data = await window.api.getCompanies();
                // If data is array of strings, just use it. If array of objects, map it.
                // Our current service returns string[]
                if (data && data.length > 0) {
                    if (typeof data[0] === 'string') {
                        setCompanies(data);
                    } else {
                        setCompanies(data.map((c: any) => c.empresa || c.Title));
                    }
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };
        fetchCompanies();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await window.api.getHistory(filters);
            setHistory(data || []);
        } catch (error) {
            console.error("Error loading history:", error);
            setHistory([]);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []); // Initial load

    // Reload when filters change (or use a button to trigger? auto-reload is nicer for some, button safer for DB. Let's do auto for non-text, debounce text?)
    // Let's stick to a explicit "Filtrar" button or Effect on dependencies if user wants instant feedback. 
    // Given the request, instant feedback on Selects and 'Enter' or 'Blur' on text is good. 
    // For simplicity and robustness, let's add a "Buscar/Filtrar" button or just hook useEffect to filters but careful with loops.
    // Let's just use useEffect on filters.
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadHistory();
        }, 300); // 300ms debounce
        return () => clearTimeout(timeoutId);
    }, [filters]);

    const handleFilterChange = (key: any, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Calculate pagination
    const totalPages = Math.ceil(history.length / RECORDS_PER_PAGE);
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    const endIndex = startIndex + RECORDS_PER_PAGE;

    const goToPage = (page: any) => {
        setCurrentPage(page);
    };

    const handleUpdateSubmit = async (updatedData: any) => {
        try {
            const res = await window.api.updateTest({ ...updatedData, id: editingTest.id });
            if (res.changes > 0) {
                setEditingTest(null);
                loadHistory();
                if (onUpdate) onUpdate();
            }
        } catch (err) {
            console.error("Error updating record:", err);
            alert("Error al actualizar el registro");
        }
    };

    const generatePDF = (test: any) => {
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text("Certificado de Control", 105, 20, { align: "center" } as any);

        doc.setFontSize(16);
        doc.text(`Enex - Planta San Vicente`, 105, 30, { align: "center" } as any);

        doc.setFontSize(12);
        doc.text(`Fecha: ${new Date(test.fecha_hora_1).toLocaleDateString()}`, 20, 50);
        doc.text(`Hora: ${new Date(test.fecha_hora_1).toLocaleTimeString()}`, 150, 50);

        doc.setLineWidth(0.5);
        doc.line(20, 55, 190, 55);

        doc.text("Detalles del Colaborador:", 20, 65);
        doc.text(`Nombre: ${test.nombre}`, 30, 75);
        doc.text(`RUT: ${test.rut}`, 30, 85);
        doc.text(`Cargo: ${test.cargo || 'N/A'}`, 30, 95);
        doc.text(`Categoría: ${displayCategory(test.categoria_persona)}`, 30, 105);
        doc.text(`Empresa: ${test.empresa || 'N/A'}`, 30, 115);
        if (test.numero_maquina) doc.text(`Patente: ${test.numero_maquina}`, 30, 125);

        doc.text("Detalles del Test:", 20, 140);
        doc.text(`N° de Test: ${test.serial_equipo || 'N/A'}`, 30, 150);
        doc.text(`Tipo: ${test.tipo_test.toUpperCase()}`, 30, 160);
        doc.text(`Resultado Muestra 1: ${test.resultado_1 ? 'POSITIVO' : 'NEGATIVO'}  (${new Date(test.fecha_hora_1).toLocaleString()})`, 30, 170);

        if (test.fecha_hora_2) {
            doc.text(`Resultado Muestra 2: ${test.resultado_2 ? 'POSITIVO' : 'NEGATIVO'}  (${new Date(test.fecha_hora_2).toLocaleString()})`, 30, 180);
            const final = (test.resultado_1 && test.resultado_2) ? 'POSITIVO CONFIRMADO' : 'NEGATIVO/NO CONCLUYENTE';
            doc.setFont('helvetica', 'bold');
            doc.text(`Estado Final: ${final}`, 30, 195);
            doc.setFont('helvetica', 'normal');
        } else {
            doc.text(`Estado: PENDIENTE SEGUNDA MUESTRA`, 30, 180);
        }

        // Signatures
        const ySign = 240;

        // Operador (Left)
        doc.line(20, ySign, 90, ySign); // Line
        doc.setFont('helvetica', 'bold');
        doc.text("Firma Operador", 55, ySign + 5, { align: "center" });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nombre: ${test.usuario_operador || ''}`, 20, ySign + 15);

        // Colaborador (Right)
        doc.line(120, ySign, 190, ySign); // Line
        doc.setFont('helvetica', 'bold');
        doc.text("Firma Colaborador", 155, ySign + 5, { align: "center" });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nombre: ${test.nombre}`, 120, ySign + 15);

        doc.save(`certificado_${test.rut}_${test.id}.pdf`);
    };

    const handleExportDB = async () => {
        const res = await window.api.exportDb();
        if (res.success) alert(`Base de datos exportada a: ${res.path}`);
    };

    const generateHistoryReport = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better fit
        doc.setFontSize(18);
        doc.text("Reporte de Controles de Alcohol y Drogas - Enex San Vicente", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 22);

        const tableData = history.map((test: any) => [
            new Date(test.fecha_hora_1).toLocaleDateString() + ' ' + new Date(test.fecha_hora_1).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            test.nombre,
            test.rut,
            test.cargo || '-',
            displayCategory(test.categoria_persona),
            test.empresa || '-',
            test.serial_equipo || '-',
            test.tipo_test.toUpperCase(),
            test.resultado_1 ? 'POSITIVO' : 'NEGATIVO',
            test.fecha_hora_2 ? (test.resultado_2 ? 'POSITIVO' : 'NEGATIVO') : '-'
        ]);

        autoTable(doc, {
            head: [['Fecha/Hora', 'Nombre', 'RUT', 'Cargo', 'Cat.', 'Empresa', 'N° Test', 'Tipo', 'Res. 1', 'Res. 2']],
            body: tableData,
            startY: 25,
            theme: 'striped',
            headStyles: { fillColor: [0, 51, 161] }, // Enex Blue
            styles: { fontSize: 8 }
        });

        doc.save(`reporte_enex_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
                <h2 className="text-2xl font-bold text-enex-blue">Historial de Registros</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 shadow-md transition-colors"
                        title="Imprimir vista actual"
                    >
                        <Printer size={16} /> Imprimir
                    </button>
                    <button
                        onClick={generateHistoryReport}
                        className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 shadow-md transition-colors"
                        title="Descargar reporte completo en PDF"
                    >
                        <FileDown size={16} /> Descargar Reporte
                    </button>
                    <button
                        onClick={handleExportDB}
                        className="flex items-center gap-2 bg-enex-blue text-white px-4 py-2 rounded hover:bg-blue-900 shadow-md transition-colors"
                        title="Exportar archivo SQLite"
                    >
                        <Database size={16} /> Exportar BD
                    </button>
                </div>
            </div>

            {/* Print Header (Only visible when printing) */}
            <div className="print-only mb-8">
                <h1 className="text-2xl font-bold text-center">Reporte de Controles - Enex San Vicente</h1>
                <p className="text-center text-sm text-gray-500">Documento interno de control de alcohol y drogas</p>
                <div className="mt-4 border-b pb-2 flex justify-between text-xs">
                    <span>Filtros aplicados: {filters.startDate || 'Inicio'} - {filters.endDate || 'Hoy'}</span>
                    <span>Fecha de impresión: {new Date().toLocaleString()}</span>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end no-print">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">RUT</label>
                    <input
                        type="text"
                        placeholder="Filtrar RUT..."
                        value={filters.searchRut}
                        onChange={(e) => handleFilterChange('searchRut', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-enex-blue focus:border-enex-blue p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={filters.searchName}
                        onChange={(e) => handleFilterChange('searchName', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-enex-blue focus:border-enex-blue p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Empresa</label>
                    <input
                        list="companies-list"
                        placeholder="Filtrar empresa..."
                        value={filters.searchEmpresa}
                        onChange={(e) => handleFilterChange('searchEmpresa', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-enex-blue focus:border-enex-blue p-2 border"
                    />
                    <datalist id="companies-list">
                        <option value="all">Todos</option>
                        {companies.map((co: any, idx: any) => (
                            <option key={idx} value={co} />
                        ))}
                    </datalist>
                </div>
                <div className="z-20 relative">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Operador</label>
                    <Combobox
                        options={['Todos', ...TEST_OPERATORS]}
                        value={filters.searchOperador === 'all' ? '' : filters.searchOperador}
                        onChange={(val) => handleFilterChange('searchOperador', (val === 'Todos' || !val) ? 'all' : val)}
                        placeholder="Filtrar operador..."
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-enex-blue focus:border-enex-blue p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Desde</label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-enex-blue focus:border-enex-blue p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Hasta</label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-enex-blue focus:border-enex-blue p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tipo</label>
                    <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-enex-blue focus:border-enex-blue p-2 border"
                    >
                        <option value="all">Todos</option>
                        <option value="alcohol">Alcohol</option>
                        <option value="droga">Droga</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Resultado</label>
                    <select
                        value={filters.result}
                        onChange={(e) => handleFilterChange('result', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-enex-blue focus:border-enex-blue p-2 border"
                    >
                        <option value="all">Todos</option>
                        <option value="0">Negativo</option>
                        <option value="1">Positivo</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end mb-2 px-2 no-print">
                <span className="text-sm font-bold text-gray-500">
                    Total Registros: <span className="text-enex-blue">{history.length}</span>
                </span>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha / Hora</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RUT</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargo</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">N° Test</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Resultado</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider no-print">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {history.slice(startIndex, endIndex).map((test: any, index: any) => {
                                const absoluteIndex = startIndex + index;
                                return (
                                    <tr key={test.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm text-gray-400 font-bold">
                                            {absoluteIndex + 1}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">
                                            {new Date(test.fecha_hora_1).toLocaleDateString()} {new Date(test.fecha_hora_1).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{test.nombre}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{test.rut}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{test.cargo || '-'}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{displayCategory(test.categoria_persona)}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{test.empresa || '-'}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{test.serial_equipo || '-'}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600 capitalize">{test.tipo_test}</td>
                                        <td className="px-4 py-2 text-sm">
                                            <div className="flex items-center gap-1">
                                                <span className={`w-3 h-3 rounded-full ${test.resultado_1 ? 'bg-red-600' : 'bg-green-600'}`}></span>
                                                <span>{test.resultado_1 ? 'Pos' : 'Neg'}</span>
                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                    ({new Date(test.fecha_hora_1).toLocaleString()})
                                                </span>
                                            </div>
                                            {test.fecha_hora_2 && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className={`w-3 h-3 rounded-full ${test.resultado_2 ? 'bg-red-600' : 'bg-green-600'}`}></span>
                                                    <span>{test.resultado_2 ? 'Pos' : 'Neg'}</span>
                                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                                        ({new Date(test.fecha_hora_2).toLocaleString()})
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-sm no-print">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => generatePDF(test)}
                                                    className="text-enex-blue hover:text-blue-900 flex items-center gap-1 font-semibold"
                                                    title="Ver Certificado"
                                                >
                                                    <FileText size={16} /> Certificado
                                                </button>
                                                <button
                                                    onClick={() => setEditingTest(test)}
                                                    className="text-amber-600 hover:text-amber-800 flex items-center gap-1 font-semibold"
                                                    title="Editar Registro"
                                                >
                                                    <Edit size={16} /> Editar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm no-print">
                    <div className="text-sm text-gray-600">
                        Mostrando <span className="font-semibold text-gray-900">{Math.min(startIndex + 1, history.length)}</span> a <span className="font-semibold text-gray-900">{Math.min(endIndex, history.length)}</span> de <span className="font-semibold text-gray-900">{history.length}</span> registros
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border rounded text-sm font-medium enabled:hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Anterior
                        </button>

                        {/* Páginas Simplificadas */}
                        {(() => {
                            const pages: any[] = [];
                            const maxVisible = 5;
                            let start = Math.max(1, currentPage - 2);
                            let end = Math.min(totalPages, start + maxVisible - 1);

                            if (end - start < maxVisible - 1) {
                                start = Math.max(1, end - maxVisible + 1);
                            }

                            for (let i = start; i <= end; i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => goToPage(i)}
                                        className={`px-3 py-1 border rounded text-sm font-medium transition-colors ${currentPage === i ? 'bg-enex-blue text-white border-enex-blue' : 'hover:bg-gray-50 text-gray-700'}`}
                                    >
                                        {i}
                                    </button>
                                );
                            }
                            return pages;
                        })()}

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border rounded text-sm font-medium enabled:hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingTest && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print transition-all">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-y-auto max-h-[95vh] border border-white/20">
                        <button
                            onClick={() => setEditingTest(null)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all z-10"
                            title="Cerrar"
                        >
                            <X size={20} />
                        </button>
                        <div className="p-2">
                            <TestForm
                                key={editingTest.id}
                                tipoTest={editingTest.tipo_test}
                                initialData={editingTest}
                                isEdit={true}
                                onSubmit={handleUpdateSubmit}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
