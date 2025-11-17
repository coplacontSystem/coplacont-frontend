import  { CategoryApi } from '../api';
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '../types';


export class CategoryService {
    static async getAll(includeInactive?: boolean): Promise<Category[]> {
        const response = await CategoryApi.getCategories(includeInactive);
        return response.data;
    }
    
    static async getById(id: number): Promise<Category> {
        const response = await CategoryApi.getCategory(id);
        return response.data;
    }

    static async create(category: CreateCategoryPayload): Promise<Category> {
        const response = await CategoryApi.postCategory(category);
        return response.data;
    }

    static async update(id: number, category: Partial<UpdateCategoryPayload>): Promise<Category> {
      const response = await CategoryApi.patchCategory(id, category);
      return response.data;
    }

    static async delete(id: number): Promise<void> {
        await CategoryApi.deleteCategory(id);
    }

    static async getByName(name: string): Promise<Category[]> {
        const response = await CategoryApi.getCategoryByName(name);
        return response.data;
    }

}
