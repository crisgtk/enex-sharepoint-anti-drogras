import React, { useEffect, useState } from 'react';
import { Search, Printer, FileDown, TestTube } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const displayCategory = (cat: any) => cat === 'Planta vinculada a empresa ENEX' ? 'Planta' : cat;

const PendingMonthly = ({ onTakeTest, onUpdateCount }: any) => {
    const [pendingList, setPendingList] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        searchName: '',
        searchRut: '',
        searchEmpresa: ''
    });

    const [loading, setLoading] = useState(true);

    const loadPending = async () => {
        setLoading(true);
        try {
            // Get current month in YYYY-MM format
            const currentMonth = new Date().toISOString().slice(0, 7);
            const data = await window.api.getPendingMonthly(currentMonth);
            setPendingList(data);
            if (onUpdateCount) onUpdateCount(data.length);
        } catch (error) {
            console.error("Error loading pending monthly:", error);
            // Optionally set error state to show in UI
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPending(); // Initial Load

        // Load companies for filter
        const fetchCompanies = async () => {
            try {
                const data = await window.api.getCompanies();
                // data is string[], not object[]
                setCompanies(data);
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };
        fetchCompanies();

        // Auto-refresh interval (every 30s) to keep sync if tests are done elsewhere
        const interval = setInterval(loadPending, 30000);
        return () => clearInterval(interval);
    }, []);

    const [currentPage, setCurrentPage] = useState(1);
    const RECORDS_PER_PAGE = 10;

    const handleFilterChange = (key: any, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    const cleanRut = (r: string) => (r || '').replace(/[^0-9kK]/g, '').toLowerCase();

    const filteredList = pendingList.filter((item: any) => {
        const nombre = item.nombre || '';
        const rut = item.rut || '';
        const empresa = item.empresa || '';

        const matchName = nombre.toLowerCase().indexOf(filters.searchName.toLowerCase()) !== -1;
        const matchRut = cleanRut(rut).indexOf(cleanRut(filters.searchRut)) !== -1;
        const matchEmpresa = filters.searchEmpresa === '' || filters.searchEmpresa === 'all' || empresa.toLowerCase().indexOf(filters.searchEmpresa.toLowerCase()) !== -1;
        return matchName && matchRut && matchEmpresa;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredList.length / RECORDS_PER_PAGE);
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    const endIndex = startIndex + RECORDS_PER_PAGE;
    const currentData = filteredList.slice(startIndex, endIndex);

    const goToPage = (page: any) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const generatePDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Pendientes Test Alcohol Mensual", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 22);

        const tableData = filteredList.map((item: any, index: any) => [
            index + 1,
            item.nombre,
            item.rut,
            displayCategory(item.categoria_persona),
            item.empresa || '-',
            item.cargo || '-'
        ]);

        autoTable(doc, {
            head: [['#', 'Nombre', 'RUT', 'Categoría', 'Empresa', 'Cargo']],
            body: tableData,
            startY: 25,
            theme: 'striped',
            headStyles: { fillColor: [0, 51, 161] },
            styles: { fontSize: 9 }
        });

        doc.save(`pendientes_alcohol_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
                <h2 className="text-2xl font-bold text-enex-blue flex items-center gap-2">
                    Test Pendientes
                    <span className="text-sm font-normal bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        {filteredList.length} pendientes
                    </span>
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 shadow-md transition-colors"
                    >
                        <Printer size={16} /> Imprimir
                    </button>
                    <button
                        onClick={generatePDF}
                        className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 shadow-md transition-colors"
                    >
                        <FileDown size={16} /> Descargar Reporte
                    </button>
                    <button
                        onClick={loadPending} // Manual refresh
                        className="flex items-center gap-2 bg-blue-100 text-enex-blue px-4 py-2 rounded hover:bg-blue-200 shadow-sm transition-colors"
                        title="Actualizar lista"
                    >
                        <Search size={16} /> Actualizar
                    </button>
                </div>
            </div>

            {/* Print Header */}
            <div className="print-only mb-8">
                <h1 className="text-2xl font-bold text-center">Listado Pendientes Test Alcohol - {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h1>
                <p className="text-center text-sm text-gray-500">Enex Planta San Vicente</p>
                <div className="mt-4 border-b pb-2 flex justify-between text-xs">
                    <span>Total Pendientes: {filteredList.length}</span>
                    <span>Fecha impresión: {new Date().toLocaleString()}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end no-print">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">RUT</label>
                    <input
                        type="text"
                        placeholder="Buscar RUT..."
                        value={filters.searchRut}
                        onChange={(e) => handleFilterChange('searchRut', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-enex-blue focus:border-enex-blue p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                    <input
                        type="text"
                        placeholder="Buscar Nombre..."
                        value={filters.searchName}
                        onChange={(e) => handleFilterChange('searchName', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-enex-blue focus:border-enex-blue p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Empresa</label>
                    <input
                        list="companies-list-pending"
                        placeholder="Filtrar empresa..."
                        value={filters.searchEmpresa}
                        onChange={(e) => handleFilterChange('searchEmpresa', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-enex-blue focus:border-enex-blue p-2 border"
                    />
                    <datalist id="companies-list-pending">
                        <option value="all">Todos</option>
                        {companies.map((co: any, idx: any) => (
                            <option key={idx} value={co} />
                        ))}
                    </datalist>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RUT</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider no-print">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        Cargando datos...
                                    </td>
                                </tr>
                            ) : filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No se encontraron resultados para la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                currentData.map((item: any, index: any) => (
                                    <tr key={`${item.rut}-${index}`} className="hover:bg-red-50 transition-colors">
                                        <td className="px-4 py-2 text-sm text-gray-400 font-bold">{startIndex + index + 1}</td>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.nombre}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600 font-mono">{item.rut}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{displayCategory(item.categoria_persona)}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{item.empresa || '-'}</td>
                                        <td className="px-4 py-2 text-sm no-print">
                                            <button
                                                onClick={() => onTakeTest(item)}
                                                className="bg-enex-blue text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-800 flex items-center gap-1 shadow transition-transform active:scale-95"
                                            >
                                                <TestTube size={14} />
                                                Realizar Test
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm no-print">
                    <div className="text-sm text-gray-600">
                        Mostrando <span className="font-semibold text-gray-900">{Math.min(startIndex + 1, filteredList.length)}</span> a <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredList.length)}</span> de <span className="font-semibold text-gray-900">{filteredList.length}</span> registros
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border rounded text-sm font-medium enabled:hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Anterior
                        </button>

                        {/* Page Numbers */}
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
        </div>
    );
};

export default PendingMonthly;
