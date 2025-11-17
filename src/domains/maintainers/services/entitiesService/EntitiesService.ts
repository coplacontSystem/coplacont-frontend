import { entitiesApi } from '../../api/entitiesApi';
import type { Entidad, EntidadParcial, EntidadToUpdate } from './types';

export class EntitiesService {
    static async getClients(includeInactive?: boolean): Promise<Entidad[]> {
        const response = await entitiesApi.getClients(includeInactive);
        return response.data.data;
    }
    static async getSuppliers(includeInactive?: boolean): Promise<Entidad[]> {
        const response = await entitiesApi.getSuppliers(includeInactive);
        return response.data.data;
    }
    static async postEntidad(data: EntidadParcial): Promise<{success:boolean; message:string; data?:Entidad}> {
        try {
            const response = await entitiesApi.postEntidad(data);
            if(response.data.success) {
                return {success: true, message: 'Entidad creada con éxito', data: response.data.data};
            } else {
                return {success: false, message: response.data.message};
            }
        } catch {
            return {success: false, message: 'Error al crear la entidad'};
        }
    }
    static async deleteEntidad(id: number): Promise<{success:boolean; message:string; data?:Entidad}> {
        try {
            const response = await entitiesApi.deleteEntidad(id);
            if(response.data.success) {
                return {success: true, message: 'Entidad eliminada con éxito', data: response.data.data};
            } else {
                return {success: false, message: response.data.message};
            }
        } catch {
            return {success: false, message: 'Error al eliminar la entidad'};
        }
    }

    static async restoreEntidad(id: number): Promise<{success:boolean; message:string; data?:Entidad}> {
        try {
            const response = await entitiesApi.restoreEntidad(id);
            if(response.data.success) {
                return {success: true, message: 'Entidad restaurada con éxito', data: response.data.data};
            } else {
                return {success: false, message: response.data.message};
            }
        } catch {
            return {success: false, message: 'Error al restaurar la entidad'};
        }
    }

    static async updateEntidad(id: number, data: EntidadToUpdate): Promise<{success:boolean; message:string; data?:Entidad}> {
        try {
            const response = await entitiesApi.updateEntidad(id, data);
            if(response.data.success) {
                return {success: true, message: 'Entidad actualizada con éxito', data: response.data.data};
            } else {
                return {success: false, message: response.data.message};
            }
        } catch {
            return {success: false, message: 'Error al actualizar la entidad'};
        }
    }




}