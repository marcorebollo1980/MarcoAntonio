import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductListResponse, ProductMutationResponse } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = '/bp/products';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<ProductListResponse> {
    return this.http.get<ProductListResponse>(this.baseUrl);
  }

  verifyIdExists(id: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/verification/${encodeURIComponent(id)}`);
  }

  createProduct(product: Product): Observable<ProductMutationResponse> {
    return this.http.post<ProductMutationResponse>(this.baseUrl, product);
  }

  updateProduct(id: string, product: Omit<Product, 'id'>): Observable<ProductMutationResponse> {
    return this.http.put<ProductMutationResponse>(`${this.baseUrl}/${encodeURIComponent(id)}`, product);
  }

  deleteProduct(id: string): Observable<ProductMutationResponse> {
    return this.http.delete<ProductMutationResponse>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }
}