import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  searchQuery: string = '';

  pageSize: number = 5;
  currentPage: number = 1;

  isLoading: boolean = true;
  openDropdownId: string | null = null;

  showDeleteModal: boolean = false;
  selectedProduct: Product | null = null;

  constructor(
    private productService: ProductService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchProducts();
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.openDropdownId = null;
  }

  fetchProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.allProducts = response.data || [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredProducts = [...this.allProducts];
    } else {
      this.filteredProducts = this.allProducts.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }
    this.currentPage = 1;
  }

  onPageSizeChange(): void {
    this.pageSize = Number(this.pageSize);
    this.currentPage = 1;
  }

  get paginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  toggleDropdown(id: string, event: Event): void {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === id ? null : id;
  }

  goToCreate(): void {
    this.router.navigate(['/products/create']);
  }

  goToEdit(product: Product): void {
    this.openDropdownId = null;
    this.router.navigate(['/products/edit', product.id]);
  }

  openDeleteModal(product: Product): void {
    this.selectedProduct = product;
    this.showDeleteModal = true;
    this.openDropdownId = null;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.selectedProduct = null;
  }

  confirmDelete(): void {
    if (!this.selectedProduct) return;
    this.productService.deleteProduct(this.selectedProduct.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Producto eliminado correctamente.');
        this.cancelDelete();
        this.fetchProducts();
      },
      error: () => {
        this.cancelDelete();
      }
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}