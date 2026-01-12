import { useState, useMemo } from "react";
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
import {
  useGetInventoryQuery,
  useCreateInventoryMutation,
  useGetInitialInventoryQuery,
  useUpdateInitialInventoryMutation,
} from "../../api/inventoryApi";
import { useGetProductsQuery } from "@/domains/maintainers/api/productApi";
import { useGetWarehousesQuery } from "@/domains/maintainers/api/warehouseApi";
import { MAIN_ROUTES, INVENTORY_ROUTES } from "@/router";
import type { InventoryItem } from "../../services/types";

export const MainPage: React.FC = () => {
  const navigate = useNavigate();

  // RTK Query hooks
  const {
    data: inventory = [],
    isLoading: inventoryLoading,
    refetch: refetchInventory,
  } = useGetInventoryQuery();
  const { data: products = [] } = useGetProductsQuery();
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const [createInventory, { isLoading: isCreating }] =
    useCreateInventoryMutation();
  const [updateInitialInventory, { isLoading: isUpdatingInitial }] =
    useUpdateInitialInventoryMutation();

  const [almacenFilter, setAlmacenFilter] = useState("");
  const [productoFilter, setProductoFilter] = useState("");
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>(
    []
  );
  const [hasFiltered, setHasFiltered] = useState(false);

  // Estados para el modal de crear
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedStock, setSelectedStock] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [error, setError] = useState("");

  // Estados para el modal de stock inicial
  const [initialModalOpen, setInitialModalOpen] = useState(false);
  const [currentInventoryId, setCurrentInventoryId] = useState<number | null>(
    null
  );
  const [initialEditEnabled, setInitialEditEnabled] = useState(false);
  const [initialStockInput, setInitialStockInput] = useState("");
  const [initialPriceInput, setInitialPriceInput] = useState("");
  const [initialOriginal, setInitialOriginal] = useState({
    stock: "",
    price: "",
  });
  const [initialStockError, setInitialStockError] = useState<string | null>(
    null
  );
  const [initialPriceError, setInitialPriceError] = useState<string | null>(
    null
  );

  // Query para inventario inicial (skip si no hay ID seleccionado)
  const {
    data: initialInventoryData,
    isLoading: initialLoading,
    isError: initialError,
    refetch: refetchInitial,
  } = useGetInitialInventoryQuery(currentInventoryId!, {
    skip: !currentInventoryId,
  });

  const displayedInventory = hasFiltered ? filteredInventory : inventory;

  // Opciones para los ComboBox de filtro
  const almacenOptions = useMemo(
    () => [
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
    ],
    [inventory]
  );

  const productOptions = useMemo(
    () => [
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
    ],
    [inventory]
  );

  // Opciones para el modal
  const modalProductOptions = products.map((product) => ({
    label: `${product.codigo} - ${product.nombre}`,
    value: product.id.toString(),
  }));

  const modalWarehouseOptions = warehouses.map((warehouse) => ({
    label: `${warehouse.id} - ${warehouse.nombre}`,
    value: warehouse.id.toString(),
  }));

  const handleFilter = () => {
    const result = inventory.filter((i) => {
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
    setFilteredInventory(result);
    setHasFiltered(true);
  };

  const headers = [
    "COD almacen",
    "Almacén",
    "COD producto",
    "Producto",
    "Stock Actual",
    "Acciones",
  ];

  const rows = displayedInventory.map((i) => ({
    id: i.id,
    cells: [
      i.almacen.id,
      i.almacen.nombre,
      i.producto.codigo,
      i.producto.nombre,
      i.stockActual,
      <div style={{ display: "flex", gap: "8px" }}>
        <Button
          size="tableItemSize"
          variant="tableItemStyle"
          onClick={() =>
            navigate(
              `${MAIN_ROUTES.INVENTORY}${INVENTORY_ROUTES.KARDEX}?inventoryId=${i.id}`
            )
          }
        >
          Ver KARDEX
        </Button>
        <Button
          size="tableItemSize"
          variant="tableItemStyle"
          onClick={() => {
            const invId = Number(i.id);
            setCurrentInventoryId(invId);
            setInitialEditEnabled(false);
            setInitialModalOpen(true);
          }}
        >
          Stock Inicial
        </Button>
      </div>,
    ],
  }));

  // Efecto para cargar datos del modal de stock inicial
  useMemo(() => {
    if (initialInventoryData && initialModalOpen) {
      const stock =
        initialInventoryData.lote?.cantidadInicial ??
        initialInventoryData.detalle?.cantidad ??
        0;
      const price = initialInventoryData.lote?.costoUnitario ?? 0;
      setInitialStockInput(String(stock));
      setInitialPriceInput(String(price));
      setInitialOriginal({ stock: String(stock), price: String(price) });
      setInitialStockError(null);
      setInitialPriceError(null);
    }
  }, [initialInventoryData, initialModalOpen]);

  const gridTemplate = "0.8fr 1fr 1.2fr 2.1fr 0.8fr 1.5fr";

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
      setError("");
      await createInventory({
        idAlmacen: Number(selectedWarehouse),
        idProducto: Number(selectedProduct),
        stockInicial: selectedStock ? Number(selectedStock) : undefined,
        precioUnitario: selectedPrice ? Number(selectedPrice) : undefined,
      }).unwrap();
      handleCloseModal();
    } catch (err) {
      console.error("Error al agregar producto al almacén:", err);
      setError(
        "No se pudo agregar el producto al almacén. Inténtalo de nuevo."
      );
    }
  };

  const handleSaveInitialInventory = async () => {
    if (!currentInventoryId) return;

    const stockNum = Number(initialStockInput);
    const priceNum = Number(initialPriceInput);
    let hasError = false;

    if (!isFinite(stockNum) || stockNum < 0) {
      setInitialStockError("Ingresa un stock válido (>= 0)");
      hasError = true;
    }
    if (!isFinite(priceNum) || priceNum < 0) {
      setInitialPriceError("Ingresa un precio válido (>= 0)");
      hasError = true;
    }
    if (hasError) return;

    try {
      await updateInitialInventory({
        idInventario: currentInventoryId,
        data: { cantidadInicial: stockNum, costoUnitario: priceNum },
      }).unwrap();
      setInitialEditEnabled(false);
      refetchInventory();
    } catch (err) {
      console.error("Error actualizando inventario inicial:", err);
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
        <Button size="small" onClick={handleFilter}>
          Filtrar
        </Button>
      </section>

      <Table
        headers={headers}
        rows={rows}
        gridTemplate={gridTemplate}
        isLoading={inventoryLoading}
        loadingText="Cargando inventario..."
      />

      {/* Modal crear inventario */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Agregar producto a almacén"
        description="Selecciona los siguientes datos para asociar un producto a un almacén."
        loading={isCreating}
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
            disabled={isCreating || !selectedProduct || !selectedWarehouse}
          >
            Guardar
          </Button>
        </div>
      </Modal>

      {/* Modal stock inicial */}
      <Modal
        isOpen={initialModalOpen}
        onClose={() => {
          setInitialModalOpen(false);
          setCurrentInventoryId(null);
          setInitialEditEnabled(false);
          setInitialStockInput("");
          setInitialPriceInput("");
          setInitialStockError(null);
          setInitialPriceError(null);
        }}
        title="Stock inicial"
        description="Consulta y edición del stock inicial y precio unitario"
        loading={initialLoading || isUpdatingInitial}
        buttonText="Cerrar"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {initialLoading && <Loader text="Cargando inventario inicial..." />}
          {!initialLoading && initialError && (
            <>
              <Text size="xs" color="danger">
                No se pudo cargar el inventario inicial
              </Text>
              <Button
                size="tableItemSize"
                variant="tableItemStyle"
                onClick={() => refetchInitial()}
              >
                Reintentar
              </Button>
            </>
          )}
          {!initialLoading && !initialError && (
            <>
              <div>
                <Text size="xs" color="neutral-primary">
                  Stock Inicial
                </Text>
                <Input
                  type="number"
                  size="xs"
                  variant="createSale"
                  value={initialStockInput}
                  onChange={(e) => {
                    setInitialStockInput(e.target.value);
                    setInitialStockError(null);
                  }}
                  placeholder="Stock inicial"
                  disabled={!initialEditEnabled}
                />
                {initialStockError && (
                  <Text size="xs" color="danger">
                    {initialStockError}
                  </Text>
                )}
              </div>
              <div>
                <Text size="xs" color="neutral-primary">
                  Precio Unitario
                </Text>
                <Input
                  type="number"
                  size="xs"
                  variant="createSale"
                  value={initialPriceInput}
                  onChange={(e) => {
                    setInitialPriceInput(e.target.value);
                    setInitialPriceError(null);
                  }}
                  placeholder="Precio unitario"
                  disabled={!initialEditEnabled}
                />
                {initialPriceError && (
                  <Text size="xs" color="danger">
                    {initialPriceError}
                  </Text>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!initialEditEnabled && (
                  <Button
                    size="tableItemSize"
                    variant="tableItemStyle"
                    onClick={() => setInitialEditEnabled(true)}
                    disabled={initialLoading || isUpdatingInitial}
                  >
                    Actualizar
                  </Button>
                )}
                {initialEditEnabled && (
                  <>
                    <Button
                      size="tableItemSize"
                      variant="tableItemStyle"
                      onClick={() => {
                        setInitialStockInput(initialOriginal.stock);
                        setInitialPriceInput(initialOriginal.price);
                        setInitialStockError(null);
                        setInitialPriceError(null);
                        setInitialEditEnabled(false);
                      }}
                      disabled={isUpdatingInitial}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="tableItemSize"
                      variant="tableItemStyle"
                      onClick={handleSaveInitialInventory}
                      disabled={
                        isUpdatingInitial ||
                        initialLoading ||
                        (initialStockInput === initialOriginal.stock &&
                          initialPriceInput === initialOriginal.price)
                      }
                    >
                      Guardar
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </PageLayout>
  );
};
