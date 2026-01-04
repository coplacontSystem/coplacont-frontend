import React, { useMemo, useState } from "react";
import styles from "./MainPage.module.scss";
import type { Transaction } from "../../services/types";
import { useGetOperationsQuery } from "../../api/transactionsApi";

import {
  Button,
  PageLayout,
  Text,
  Modal,
  Loader,
  ComboBox,
  Input,
  Divider,
} from "@/components";
import { Table, type TableRow } from "@/components/organisms/Table";
import {
  documentTypeOptions,
  filterTypeOptions,
  monthOptions,
  yearOptions,
} from "./MainFilterData";
import { useNavigate } from "react-router-dom";
import { MAIN_ROUTES, TRANSACTIONS_ROUTES, COMMON_ROUTES } from "@/router";

const MainPage: React.FC = () => {
  const { data: operations = [], isLoading } = useGetOperationsQuery();
  const [filteredOperations, setFilteredOperations] = useState<Transaction[]>(
    []
  );
  const [hasFiltered, setHasFiltered] = useState(false);

  const navigate = useNavigate();

  const displayedOperations = hasFiltered ? filteredOperations : operations;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] =
    useState<Transaction | null>(null);

  const [filterType, setFilterType] = useState("mes-anio");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [entity, setEntity] = useState("");
  const [provider, setProvider] = useState("");
  const [documentType, setDocumentType] = useState("");

  const applyAllFilters = () => {
    let filtered = [...operations];

    if (entity) {
      filtered = filtered.filter((operation) =>
        operation.persona?.razonSocial
          ?.toLowerCase()
          .includes(entity.toLowerCase())
      );
    }

    if (provider) {
      filtered = filtered.filter((operation) =>
        operation.persona?.razonSocial
          ?.toLowerCase()
          .includes(provider.toLowerCase())
      );
    }

    if (documentType) {
      filtered = filtered.filter((operation) => {
        const tipoComprobante =
          typeof operation.tipoComprobante === "string"
            ? operation.tipoComprobante
            : operation.tipoComprobante?.descripcion || "";
        return tipoComprobante
          .toLowerCase()
          .includes(documentType.toLowerCase());
      });
    }

    if (filterType === "rango-fechas" && startDate && endDate) {
      filtered = filtered.filter((operation) => {
        const operationDate = new Date(operation.fechaEmision);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return operationDate >= start && operationDate <= end;
      });
    } else if (filterType === "mes-anio" && month && year) {
      filtered = filtered.filter((operation) => {
        const operationDate = new Date(operation.fechaEmision);
        return (
          operationDate.getMonth() + 1 === parseInt(month) &&
          operationDate.getFullYear() === parseInt(year)
        );
      });
    }

    setFilteredOperations(filtered);
    setHasFiltered(true);
  };

  const handleTopFilter = () => {
    applyAllFilters();
  };

  const handleSecondaryFilter = () => {
    applyAllFilters();
  };

  const handleRegisterOperation = () => {
    navigate(
      `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.OPERATIONS}${COMMON_ROUTES.REGISTER}`
    );
  };

  const handleOpenDetailModal = (operation: Transaction) => {
    setSelectedOperation(operation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOperation(null);
  };

  const tableData = useMemo(() => {
    const headers = [
      "Correlativo",
      "Fecha",
      "Tipo Operación",
      "Tipo Comprobante",
      "Serie",
      "Número",
      "Entidad",
      "Total",
      "Acciones",
    ];

    const rows: TableRow[] = displayedOperations.map((operation) => ({
      id: operation.idComprobante,
      cells: [
        operation.correlativo || "-",
        new Date(operation.fechaEmision).toLocaleDateString("es-PE"),
        operation.tipoOperacion?.descripcion || "-",
        typeof operation.tipoComprobante === "string"
          ? operation.tipoComprobante
          : operation.tipoComprobante?.descripcion || "-",
        operation.serie || "-",
        operation.numero || "-",
        operation.persona?.razonSocial || "-",
        `S/ ${parseFloat(operation.totales?.totalGeneral || "0").toFixed(2)}`,
        <Button
          key={`btn-${operation.idComprobante}`}
          size="tableItemSize"
          variant="tableItemStyle"
          onClick={() => handleOpenDetailModal(operation)}
        >
          Ver Detalle
        </Button>,
      ],
    }));

    return { headers, rows };
  }, [displayedOperations]);

  const gridTemplate = "0.5fr 0.5fr 1fr 0.8fr 0.5fr 0.5fr 0.8fr 0.5fr 0.8fr";

  return (
    <PageLayout
      title="Operaciones"
      subtitle="Gestiona las operaciones distintas a compras y ventas"
    >
      <div className={styles.homePurchasePage}>
        <section className={styles.filtersTop}>
          <div className={styles.filter}>
            <Text size="xs" color="neutral-primary">
              Tipo de filtro
            </Text>
            <ComboBox
              options={filterTypeOptions}
              value={filterType}
              size="xs"
              onChange={(value) => setFilterType(value as string)}
              placeholder="Seleccionar filtro"
            />
          </div>

          {filterType === "mes-anio" && (
            <>
              <div className={styles.filter}>
                <Text size="xs" color="neutral-primary">
                  Mes
                </Text>
                <ComboBox
                  options={monthOptions}
                  value={month}
                  size="xs"
                  onChange={(value) => setMonth(String(value))}
                  placeholder="Seleccionar mes"
                />
              </div>
              <div className={styles.filter}>
                <Text size="xs" color="neutral-primary">
                  Año
                </Text>
                <ComboBox
                  size="xs"
                  options={yearOptions}
                  value={year}
                  onChange={(value) => setYear(String(value))}
                  placeholder="Seleccionar año"
                />
              </div>
            </>
          )}

          {filterType === "rango-fechas" && (
            <>
              <div className={styles.filter}>
                <Text size="xs" color="neutral-primary">
                  Fecha inicio
                </Text>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setStartDate(e.target.value)
                  }
                />
              </div>
              <div className={styles.filter}>
                <Text size="xs" color="neutral-primary">
                  Fecha fin
                </Text>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEndDate(e.target.value)
                  }
                />
              </div>
            </>
          )}

          <Button size="small" onClick={handleTopFilter}>
            Filtrar
          </Button>
        </section>

        <Divider />

        <section className={styles.actionsRow}>
          <Button size="medium" onClick={handleRegisterOperation}>
            + Nueva operación
          </Button>
        </section>

        <Divider />

        <section className={styles.filtersSecondary}>
          <div className={styles.filter}>
            <Text size="xs" color="neutral-primary">
              Entidad
            </Text>
            <Input
              placeholder="Buscar por entidad"
              value={entity}
              size="xs"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEntity(e.target.value)
              }
            />
          </div>
          <div className={styles.filter}>
            <Text size="xs" color="neutral-primary">
              Proveedor/Cliente
            </Text>
            <Input
              size="xs"
              placeholder="Buscar por proveedor o cliente"
              value={provider}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setProvider(e.target.value)
              }
            />
          </div>
          <div className={styles.filter}>
            <Text size="xs" color="neutral-primary">
              Tipo de documento
            </Text>
            <ComboBox
              size="xs"
              options={documentTypeOptions}
              value={documentType}
              onChange={(value) => setDocumentType(String(value))}
              placeholder="Seleccionar tipo"
            />
          </div>

          <Button size="small" onClick={handleSecondaryFilter}>
            Filtrar búsqueda
          </Button>
        </section>

        <Divider />

        {isLoading ? (
          <Loader />
        ) : (
          <Table
            headers={tableData.headers}
            rows={tableData.rows}
            gridTemplate={gridTemplate}
          />
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Detalle de operación"
          description="Información detallada de la operación seleccionada"
        >
          {selectedOperation && (
            <div>
              <Text size="md" weight={600}>
                Correlativo: {selectedOperation.correlativo}
              </Text>
              <Text size="sm">
                Fecha:{" "}
                {new Date(selectedOperation.fechaEmision).toLocaleDateString(
                  "es-PE"
                )}
              </Text>
              <Text size="sm">
                Comprobante:{" "}
                {typeof selectedOperation.tipoComprobante === "string"
                  ? selectedOperation.tipoComprobante
                  : selectedOperation.tipoComprobante?.descripcion || "-"}
              </Text>
              <Text size="sm">Serie: {selectedOperation.serie}</Text>
              <Text size="sm">Número: {selectedOperation.numero}</Text>
              <Text size="sm">
                Entidad: {selectedOperation.persona?.razonSocial}
              </Text>
              <Text size="sm">
                Tipo de Operación:{" "}
                {selectedOperation.tipoOperacion?.descripcion || "-"}
              </Text>
              <Text size="sm">
                Total: S/{" "}
                {parseFloat(
                  selectedOperation.totales?.totalGeneral || "0"
                ).toFixed(2)}
              </Text>
            </div>
          )}
        </Modal>
      </div>
    </PageLayout>
  );
};

export default MainPage;
