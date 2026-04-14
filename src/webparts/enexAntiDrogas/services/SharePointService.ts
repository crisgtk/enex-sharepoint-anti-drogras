import { getSP } from "../PnpConfig";
import { SPFI } from "@pnp/sp";
import "@pnp/sp/presets/all";
import { TRANSPORTERS } from "./transporters";

export class SharePointService {
    private static instance: SharePointService;

    // Use a getter instead of a field to ensure PnP is accessed when it's ready.
    private get sp(): SPFI {
        return getSP();
    }

    private constructor() { }

    public static getInstance(): SharePointService {
        if (!SharePointService.instance) {
            SharePointService.instance = new SharePointService();
        }
        return SharePointService.instance;
    }

    private formatRut(rut: string): string {
        const clean = rut.replace(/[^0-9kK]/g, '');
        if (clean.length < 2) return clean;
        const body = clean.slice(0, -1);
        const dv = clean.slice(-1).toUpperCase();
        return new Intl.NumberFormat('es-CL').format(parseInt(body)).replace(/,/g, '.') + '-' + dv;
    }

    /**
     * Ensures all necessary lists and columns exist in the SharePoint site.
     */
    public async ensureSchema(): Promise<void> {
        console.log("Ensuring SharePoint schema...");
        try {
            // 1. EnexTestHistory
            await this.ensureList("EnexTestHistory", [
                { name: "Rut", type: "Text" },
                { name: "Nombre", type: "Text" },
                { name: "Empresa", type: "Text" },
                { name: "CategoriaPersona", type: "Text" },
                { name: "Cargo", type: "Text" },
                { name: "Resultado1", type: "Text" },
                { name: "Resultado2", type: "Text" },
                { name: "TipoTest", type: "Text" },
                { name: "NumeroMaquina", type: "Text" },
                { name: "SerialEquipo", type: "Text" },
                { name: "UsuarioOperador", type: "Text" },
                { name: "Fecha", type: "DateTime" },
                { name: "Observaciones", type: "Note" }
            ]);

            // 2. EnexPending
            await this.ensureList("EnexPending", [
                { name: "Rut", type: "Text" },
                { name: "Nombre", type: "Text" },
                { name: "Empresa", type: "Text" },
                { name: "CategoriaPersona", type: "Text" },
                { name: "Cargo", type: "Text" }
            ], [
                { Title: "Juan Perez", Rut: "12.345.678-9", Nombre: "Juan Perez", Empresa: "Enex", CategoriaPersona: "Planta", Cargo: "Operador" },
                { Title: "Maria Jara", Rut: "9.876.543-2", Nombre: "Maria Jara", Empresa: "Transportes CV", CategoriaPersona: "Externo", Cargo: "Conductor" }
            ]);

            // 3. EnexMonthlyPending
            const currentMonthStr = new Date().toISOString().slice(0, 7);
            const monthlyPendingSeed = TRANSPORTERS.slice(0, 10).map(t => ({ // Just seed a few for monthly to avoid bloat
                Title: t.nombre,
                Rut: this.formatRut(t.rut),
                Nombre: t.nombre,
                Empresa: t.empresa,
                Mes: currentMonthStr
            }));

            await this.ensureList("EnexMonthlyPending", [
                { name: "Rut", type: "Text" },
                { name: "Nombre", type: "Text" },
                { name: "Empresa", type: "Text" },
                { name: "Mes", type: "Text" }
            ], monthlyPendingSeed);

            // 4. EnexRouletteUsers
            const rouletteUsersSeed = TRANSPORTERS.map(t => ({
                Title: t.nombre,
                Nombre: t.nombre,
                Rut: this.formatRut(t.rut),
                Empresa: t.empresa,
                CategoriaPersona: "Transportista",
                Cargo: "Conductor"
            }));



            await this.ensureList("EnexRouletteUsers", [
                { name: "Nombre", type: "Text" },
                { name: "Rut", type: "Text" },
                { name: "Cargo", type: "Text" },
                { name: "Empresa", type: "Text" },
                { name: "CategoriaPersona", type: "Text" }
            ], rouletteUsersSeed);

            console.log("Schema verified successfully.");
        } catch (error) {
            console.error("Error ensuring schema:", error);
        }
    }

    private async ensureList(title: string, columns: { name: string, type: "Text" | "Note" | "DateTime" | "Number" }[], seedData: any[] = []): Promise<void> {
        let list;
        let isNew = false;
        try {
            const listObj = this.sp.web.lists.getByTitle(title);
            await listObj(); // Check if exists
            list = listObj;
        } catch (e) {
            console.log(`Creating list: ${title}`);
            const result = await this.sp.web.lists.add(title, "", 100, false);
            list = result.list;
            isNew = true;
        }

        // Check for missing columns
        const existingFields = await list.fields.select("InternalName", "Title")();
        const existingNames = new Set(existingFields.map(f => f.InternalName.toLowerCase()));

        for (const col of columns) {
            if (!existingNames.has(col.name.toLowerCase())) {
                console.log(`Adding missing column ${col.name} to ${title}`);
                try {
                    if (col.type === "Text") {
                        await list.fields.addText(col.name);
                    } else if (col.type === "Note") {
                        await list.fields.addMultilineText(col.name);
                    } else if (col.type === "DateTime") {
                        await list.fields.addDateTime(col.name);
                    } else if (col.type === "Number") {
                        await list.fields.addNumber(col.name);
                    }
                    const field = await list.fields.getByInternalNameOrTitle(col.name)();
                    await list.defaultView.fields.add(field.InternalName);
                } catch (fieldError) {
                    console.error(`Error adding field ${col.name}:`, fieldError);
                }
            }
        }

        // If newly created OR list is empty, add seed data
        const items = await list.items.select("Id").top(1)();
        if (isNew || items.length === 0) {
            console.log(`Seeding list: ${title} with ${seedData.length} items`);
            // Add seed data in batches to avoid overwhelming SP if many
            const batchSize = 10;
            for (let i = 0; i < seedData.length; i += batchSize) {
                const batch = seedData.slice(i, i + batchSize);
                await Promise.all(batch.map(item => list.items.add(item)));
            }
        } else if (title === "EnexRouletteUsers") {
            // Special case: check for missing transporters and add them
            console.log("Checking for missing transporters in EnexRouletteUsers...");
            const allExisting = await list.items.select("Rut").top(5000)();
            const existingRuts = new Set(allExisting.map(i => i.Rut));

            const missing = seedData.filter(s => !existingRuts.has(s.Rut));
            if (missing.length > 0) {
                console.log(`Adding ${missing.length} missing transporters to EnexRouletteUsers`);
                const batchSize = 5;
                for (let i = 0; i < missing.length; i += batchSize) {
                    const batch = missing.slice(i, i + batchSize);
                    await Promise.all(batch.map(item => list.items.add(item)));
                }
            }
        }
    }

    // --- API MAPPING ---

    public async searchRut(rut: string): Promise<any> {
        // Search in History, Pending or Roulette Users for auto-fill
        const history = await this.sp.web.lists.getByTitle("EnexTestHistory").items
            .filter(`Rut eq '${rut}'`)
            .orderBy("Created", false)
            .top(1)();
        if (history.length > 0) {
            const item = history[0];
            return {
                ...item,
                nombre: item.Nombre,
                rut: item.Rut,
                empresa: item.Empresa,
                categoria_persona: item.CategoriaPersona,
                cargo: item.Cargo
            };
        }

        const pending = await this.sp.web.lists.getByTitle("EnexPending").items
            .filter(`Rut eq '${rut}'`)
            .top(1)();
        if (pending.length > 0) {
            const item = pending[0];
            return {
                ...item,
                nombre: item.Nombre,
                rut: item.Rut,
                empresa: item.Empresa,
                categoria_persona: item.CategoriaPersona,
                cargo: item.Cargo
            };
        }

        const roulette = await this.sp.web.lists.getByTitle("EnexRouletteUsers").items
            .filter(`Rut eq '${rut}'`)
            .top(1)();
        if (roulette.length > 0) {
            const item = roulette[0];
            return {
                ...item,
                nombre: item.Nombre,
                rut: item.Rut,
                empresa: item.Empresa,
                categoria_persona: item.CategoriaPersona,
                cargo: item.Cargo
            };
        }

        return null;
    }

    public async insertTest(data: any): Promise<any> {
        try {
            const payload = {
                Title: String(data.nombre || "Sin Nombre"),
                Rut: String(data.rut || ""),
                Nombre: String(data.nombre || ""),
                Empresa: String(data.empresa || ""),
                CategoriaPersona: String(data.categoria_persona || ""),
                Cargo: String(data.cargo || ""),
                Resultado1: String(data.resultado_1 !== undefined ? (data.resultado_1 === 1 || data.resultado_1 === true ? "1" : "0") : ""),
                Resultado2: String(data.resultado_2 !== undefined ? (data.resultado_2 === 1 || data.resultado_2 === true ? "1" : "0") : ""),
                TipoTest: String(data.tipo_test || ""),
                NumeroMaquina: String(data.numero_maquina || ""),
                SerialEquipo: String(data.serial_equipo || ""),
                UsuarioOperador: String(data.usuario_operador || ""),
                Fecha: new Date().toISOString(),
                Observaciones: String(data.observaciones || "")
            };
            console.log("Sending payload to EnexTestHistory:", payload);
            const result = await this.sp.web.lists.getByTitle("EnexTestHistory").items.add(payload);

            // If it was a monthly pending test, the dynamic list will update automatically
            // because a new record is now in EnexTestHistory.
            // We can still try to remove from manual lists if they exist.
            try {
                const pendingItems = await this.sp.web.lists.getByTitle("EnexPending").items
                    .filter(`Rut eq '${data.rut}'`)();

                for (const item of pendingItems) {
                    await this.sp.web.lists.getByTitle("EnexPending").items.getById(item.Id).delete();
                }
            } catch (pendingErr) {
                // Silently ignore if not found or list missing
            }

            // Also check if user is Planta and Enex, and if so, insert them into Roulette if they don't exist
            if (
                data.categoria_persona?.toLowerCase() === 'planta' && 
                data.empresa?.toLowerCase() === 'enex' &&
                data.rut
            ) {
                try {
                    const existingInRoulette = await this.sp.web.lists.getByTitle("EnexRouletteUsers").items
                        .filter(`Rut eq '${data.rut}'`)();
                        
                    if (existingInRoulette.length === 0) {
                        await this.sp.web.lists.getByTitle("EnexRouletteUsers").items.add({
                            Title: String(data.nombre || "Sin Nombre"),
                            Nombre: String(data.nombre || ""),
                            Rut: String(data.rut || ""),
                            Empresa: String(data.empresa || ""),
                            CategoriaPersona: String(data.categoria_persona || ""),
                            Cargo: String(data.cargo || "")
                        });
                        console.log("Auto-registered user in Roulette");
                    }
                } catch (err) {
                    console.error("Error auto-adding to roulette:", err);
                }
            }

            return result;
        } catch (error) {
            console.error("Critical error in insertTest:", error);
            throw error;
        }
    }

    public async getPending(): Promise<any[]> {
        // According to user requirements: Tests that are positive in sample 1 but have no sample 2 yet.
        const items = await this.sp.web.lists.getByTitle("EnexTestHistory").items
            .filter("(Resultado1 eq '1' or Resultado1 eq 'true') and (Resultado2 eq '' or Resultado2 eq null)")();

        return items.map(i => ({
            ...i,
            id: i.Id,
            rut: i.Rut,
            nombre: i.Nombre,
            empresa: i.Empresa,
            categoria_persona: i.CategoriaPersona,
            cargo: i.Cargo,
            tipo_test: i.TipoTest,
            resultado_1: i.Resultado1 === "1" || i.Resultado1 === "true",
            fecha_hora_1: i.Fecha
        }));
    }

    public async getPendingMonthly(month: string): Promise<any[]> {
        try {
            // 1. Get all employees from master list (DB de usuarios)
            const allUsers = await this.getRouletteUsers();

            // 2. Get all alcohol tests for the specified month (e.g., "2026-03")
            const startDate = `${month}-01T00:00:00Z`;

            // Calculate next month for upper bound (e.g., "2026-04-01")
            const [year, m] = month.split('-').map(Number);
            const nextMonthDate = new Date(year, m, 1);
            const endDate = nextMonthDate.toISOString();

            const tests = await this.sp.web.lists.getByTitle("EnexTestHistory").items
                .filter(`TipoTest eq 'alcohol' and Fecha ge '${startDate}' and Fecha lt '${endDate}'`)
                .select("Rut")();

            const clean = (r: string) => (r || '').replace(/[^0-9kK]/g, '').toLowerCase();
            const testedRuts = new Set(tests.map(t => clean(t.Rut)));

            // 3. Return those who are in the DB but NOT in the tested list this month
            return allUsers.filter(u => !testedRuts.has(clean(u.rut))).map(u => ({
                ...u,
                id: u.id,
                rut: u.rut,
                nombre: u.nombre,
                empresa: u.empresa,
                categoria_persona: u.categoria_persona,
                cargo: u.cargo
            }));
        } catch (error) {
            console.error("Error calculating dynamic monthly pending:", error);
            return [];
        }
    }

    public async getHistory(filters: any = {}): Promise<any[]> {
        try {
            console.log("Loading history with filters:", JSON.stringify(filters));
            const list = this.sp.web.lists.getByTitle("EnexTestHistory");

            // Base filter: Include all except those PENDING (Pos1 without Pos2)
            // Logic: Show if (Sample 1 is NOT Positive) OR (Sample 2 is NOT Empty)
            let conditions: string[] = ["((Resultado1 ne '1' and Resultado1 ne 'true') or (Resultado2 ne '' and Resultado2 ne null))"];

            if (filters.searchRut) {
                // Filter by exact RUT (formatted)
                conditions.push(`Rut eq '${filters.searchRut}'`);
            }

            if (filters.searchName && filters.searchName.trim() !== "") {
                conditions.push(`substringof('${filters.searchName}', Nombre)`);
            }

            if (filters.searchEmpresa && filters.searchEmpresa !== 'all' && filters.searchEmpresa.trim() !== "") {
                conditions.push(`substringof('${filters.searchEmpresa}', Empresa)`);
            }

            if (filters.searchOperador && filters.searchOperador !== 'all' && filters.searchOperador.trim() !== "") {
                conditions.push(`substringof('${filters.searchOperador}', UsuarioOperador)`);
            }

            if (filters.type && filters.type !== 'all') {
                conditions.push(`TipoTest eq '${filters.type}'`);
            }

            if (filters.result && filters.result !== 'all') {
                if (filters.result === '1') {
                    // Result 1 is positive
                    conditions.push("(Resultado1 eq '1' or Resultado1 eq 'true')");
                } else if (filters.result === '0') {
                    // Result 1 is negative
                    conditions.push("(Resultado1 eq '0' or Resultado1 eq 'false')");
                }
            }

            // Date Filters
            if (filters.startDate) {
                const start = new Date(filters.startDate);
                start.setHours(0, 0, 0, 0);
                conditions.push(`Fecha ge datetime'${start.toISOString().split('.')[0]}Z'`);
            }
            if (filters.endDate) {
                const end = new Date(filters.endDate);
                end.setHours(23, 59, 59, 999);
                conditions.push(`Fecha le datetime'${end.toISOString().split('.')[0]}Z'`);
            }

            const filterString = conditions.map(c => `(${c})`).join(" and ");
            console.log("Final SharePoint filter:", filterString);

            const items = await list.items
                .filter(filterString)
                .orderBy("Fecha", false)
                .top(500)();

            console.log(`Found ${items.length} history items.`);

            return items.map(i => ({
                ...i,
                id: i.Id,
                rut: i.Rut,
                nombre: i.Nombre,
                empresa: i.Empresa,
                fecha_hora_1: i.Fecha,
                fecha_hora_2: (i.Resultado2 && i.Resultado2 !== "") ? i.Fecha : null,
                resultado_1: i.Resultado1 === "1" || i.Resultado1 === "true",
                resultado_2: i.Resultado2 === "1" || i.Resultado2 === "true",
                tipo_test: i.TipoTest,
                categoria_persona: i.CategoriaPersona,
                usuario_operador: i.UsuarioOperador,
                cargo: i.Cargo,
                serial_equipo: i.SerialEquipo,
                numero_maquina: i.NumeroMaquina
            }));
        } catch (error) {
            console.error("Critical error in getHistory fetching:", error);
            return [];
        }
    }

    public async updateTest(data: any): Promise<any> {
        try {
            const result = await this.sp.web.lists.getByTitle("EnexTestHistory").items.getById(data.id).update({
                Title: String(data.nombre || "Sin Nombre"),
                Rut: String(data.rut || ""),
                Nombre: String(data.nombre || ""),
                Empresa: String(data.empresa || ""),
                CategoriaPersona: String(data.categoria_persona || ""),
                Cargo: String(data.cargo || ""),
                Resultado1: String(data.resultado_1 === 1 || data.resultado_1 === true ? "1" : "0"),
                Resultado2: String(data.resultado_2 === 1 || data.resultado_2 === true ? "1" : "0"),
                NumeroMaquina: String(data.numero_maquina || ""),
                SerialEquipo: String(data.serial_equipo || ""),
                Observaciones: data.observaciones || "",
                UsuarioOperador: data.usuario_operador
            });
            return { changes: 1, ...result }; // Add mock changes for backward compatibility with component
        } catch (error) {
            console.error("Error in updateTest:", error);
            throw error;
        }
    }

    public async updateTestResult2(data: any): Promise<any> {
        try {
            const result = await this.sp.web.lists.getByTitle("EnexTestHistory").items.getById(data.id).update({
                Resultado2: String(data.resultado_2 === 1 || data.resultado_2 === true ? "1" : "0"),
                Fecha: new Date().toISOString()
            });
            return { changes: 1, ...result };
        } catch (error) {
            console.error("Error in updateTestResult2:", error);
            throw error;
        }
    }

    public async getRouletteUsers(): Promise<any[]> {
        const items = await this.sp.web.lists.getByTitle("EnexRouletteUsers").items();
        return items.map(i => ({
            ...i,
            id: i.Id,
            rut: i.Rut,
            nombre: i.Nombre,
            cargo: i.Cargo,
            empresa: i.Empresa,
            categoria_persona: i.CategoriaPersona
        }));
    }

    public async getCompanies(): Promise<string[]> {
        // Fixed list or from history
        return ["Enex", "Trans-vanc", "Transportes CV", "M&M", "Copec", "Otros"];
    }
}

