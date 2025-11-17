import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MainPage.module.scss";
import {
  PageLayout,
  Button,
  Table,
  Text,
  ComboBox,
  Modal,
  Loader,
  Input,
} from "@/components";
import { InventoryService } from "../../services/InventoryService";
import {
  ProductService,
  WarehouseService,
} from "@/domains/maintainers/services";
import { MAIN_ROUTES, INVENTORY_ROUTES } from "@/router";
import type { InventoryItem } from "../../services/types";
import type { Product, Warehouse } from "@/domains/maintainers/types";

export const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [almacenFilter, setAlmacenFilter] = useState(""); // filtro almacén
  const [productoFilter, setProductoFilter] = useState(""); // filtro producto

  // Estados para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedStock, setSelectedStock] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getInventory();
      setInventory(response);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await ProductService.getAll();
      setProducts(response);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await WarehouseService.getAll();
      setWarehouses(response);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  // 🔹 Opciones para los ComboBox
  const almacenOptions = [
    { label: "Todos", value: "" },
    ...Array.from(
      new Map(
        inventory.map((i) => [
          i.almacen.id,
          {
            label: `${i.almacen.id} - ${i.almacen.nombre}`,
            value: String(i.almacen.id),
          },
        ])
      ).values()
    ),
  ];

  const productOptions = [
    { label: "Todos", value: "" },
    ...Array.from(
      new Map(
        inventory.map((i) => [
          i.producto.codigo,
          {
            label: `${i.producto.codigo} - ${i.producto.descripcion}`,
            value: i.producto.codigo,
          },
        ])
      ).values()
    ),
  ];

  // Opciones para el modal
  const modalProductOptions = products.map((product) => ({
    label: `${product.codigo} - ${product.nombre}`,
    value: product.id.toString(),
  }));

  const modalWarehouseOptions = warehouses.map((warehouse) => ({
    label: `${warehouse.id} - ${warehouse.nombre}`,
    value: warehouse.id.toString(),
  }));

  // 🔹 Filtrar inventario por almacén y producto (código o nombre)
  const filteredInventory = useMemo(() => {
    return inventory.filter((i) => {
      const matchAlmacen =
        almacenFilter === "" ||
        String(i.almacen.id)
          .toLowerCase()
          .includes(almacenFilter.toLowerCase()) ||
        i.almacen.nombre.toLowerCase().includes(almacenFilter.toLowerCase());

      const matchProducto =
        productoFilter === "" ||
        i.producto.codigo
          .toLowerCase()
          .includes(productoFilter.toLowerCase()) ||
        i.producto.descripcion
          .toLowerCase()
          .includes(productoFilter.toLowerCase());

      return matchAlmacen && matchProducto;
    });
  }, [inventory, almacenFilter, productoFilter]);

  const headers = [
    "COD almacen",
    "Almacén",
    "COD producto",
    "Producto",
    "Stock Actual",
    "Acciones",
  ];

  const rows = filteredInventory.map((i) => ({
    id: i.id,
    cells: [
      i.almacen.id,
      i.almacen.nombre,
      i.producto.codigo,
      i.producto.nombre,
      i.stockActual,
      <Button
        size="tableItemSize"
        variant="tableItemStyle"
        onClick={() => {
          navigate(
            `${MAIN_ROUTES.INVENTORY}${INVENTORY_ROUTES.KARDEX}?inventoryId=${i.id}`
          );
        }}
      >
        Ver KARDEX
      </Button>,
    ],
  }));

  const gridTemplate = "1fr 1.2fr 1.2fr 2fr 1fr 1fr";

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setSelectedProduct("");
    setSelectedWarehouse("");
    setError("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct("");
    setSelectedWarehouse("");
    setSelectedStock("");
    setSelectedPrice("");
    setError("");
  };

  const handleSaveProductToWarehouse = async () => {
    if (!selectedProduct || !selectedWarehouse) {
      setError("Por favor selecciona un producto y un almacén.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const stockValue = selectedStock ? Number(selectedStock) : undefined;
      const priceValue = selectedPrice ? Number(selectedPrice) : undefined;

      const payload = {
        idAlmacen: Number(selectedWarehouse),
        idProducto: Number(selectedProduct),
        stockInicial: stockValue,
        precioUnitario: priceValue,
      };

      await InventoryService.createInventory(payload);

      // Cerrar modal y refrescar inventario
      handleCloseModal();
      await fetchInventory();
    } catch (error) {
      console.error("Error al agregar producto al almacén:", error);
      setError(
        "No se pudo agregar el producto al almacén. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Inventario"
      subtitle="Listado de productos disponibles con sus cantidades actuales en stock."
      header={
        <Button onClick={handleOpenModal} size="large">
          + Producto a almacen
        </Button>
      }
    >
      <section className={styles.MainPage}>
        <div className={styles.MainPage__Filter}>
          <Text size="xs" color="neutral-primary">
            Almacén
          </Text>
          <ComboBox
            options={almacenOptions}
            size="xs"
            variant="createSale"
            value={almacenFilter}
            onChange={(v) => setAlmacenFilter(v as string)}
            placeholder="Seleccionar"
          />
        </div>
        <div className={styles.MainPage__Filter}>
          <Text size="xs" color="neutral-primary">
            Producto
          </Text>
          <ComboBox
            options={productOptions}
            size="xs"
            variant="createSale"
            value={productoFilter}
            onChange={(v) => setProductoFilter(v as string)}
            placeholder="Seleccionar"
          />
        </div>
      </section>
      <Table headers={headers} rows={rows} gridTemplate={gridTemplate} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Agregar producto a almacén"
        description="Selecciona los siguientes datos para asociar un producto a un almacén."
        loading={loading}
        buttonText="Cerrar"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <Text size="xs" color="neutral-primary">
              Almacén
            </Text>
            <ComboBox
              options={modalWarehouseOptions}
              size="xs"
              variant="createSale"
              value={selectedWarehouse}
              onChange={(v) => setSelectedWarehouse(v as string)}
              placeholder="Seleccionar"
            />
          </div>
          <div>
            <Text size="xs" color="neutral-primary">
              Producto
            </Text>
            <ComboBox
              options={modalProductOptions}
              size="xs"
              variant="createSale"
              value={selectedProduct}
              onChange={(v) => setSelectedProduct(v as string)}
              placeholder="Seleccionar"
            />
          </div>

          <div>
            <Text size="xs" color="neutral-primary">
              Stock Inicial
            </Text>
            <Input
              type="number"
              size="xs"
              variant="createSale"
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              placeholder="Ingresa el stock inicial"
            />
          </div>

          <div>
            <Text size="xs" color="neutral-primary">
              Precio
            </Text>
            <Input
              type="number"
              size="xs"
              variant="createSale"
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              placeholder="Ingresa el precio unitario"
            />
          </div>

          {error && (
            <Text size="xs" color="danger">
              {error}
            </Text>
          )}

          <Button
            onClick={handleSaveProductToWarehouse}
            size="large"
            disabled={loading || !selectedProduct || !selectedWarehouse}
          >
            Guardar
          </Button>
        </div>
      </Modal>
      {loading && <Loader text="Procesando..." />}
    </PageLayout>
  );
};
