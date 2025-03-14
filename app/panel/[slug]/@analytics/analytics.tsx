"use client";

import { useState, useMemo, useEffect } from "react";
import { SlidersHorizontal, Users, Package, Calendar } from "lucide-react";
import { isWithinInterval } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";
import type {
  PersonelType,
  ServicesType,
  VisitType,
  Visit_itemType,
  PaymentsType,
  OperationType,
  ItemsType,
} from "@/lib/types";

// Import our custom hooks that use Redux
import { usePersonel_e02ed2 } from "@/hooks/personel/e02ed2";
import { useServices_10cd39 } from "@/hooks/services/10cd39";
import { useVisits } from "@/hooks/visit/ae978b";
import { usePayments } from "@/hooks/payments/main";
import { useItems_691d50 } from "@/hooks/items/691d50";
import { useAppSelector } from "@/store/HOCs";

// Import components
import { SummaryCards } from "./(sections)/SummaryCards";
import { FilterSection } from "./(sections)/FilterSection";
import { PersonnelTable } from "./(sections)/PersonnelTable";
import { InventoryTable } from "./(sections)/InventoryTable";
import { VisitsTable } from "./(sections)/VisitsTable";
import type { PersonnelWithMetrics } from "./(sections)/types";
import PersonnelModal from "../@presonels/(modals)/personel_modal";
import type {
  PersonnelFilters,
  InventoryFilters,
  VisitFilters,
} from "./(sections)/types";
import { PersonnelCharts } from "./(sections)/charts/PersonnelCharts";
import { InventoryCharts } from "./(sections)/charts/InventoryCharts";
import { VisitsCharts } from "./(sections)/charts/VisitsCharts";

// Add TabType for type safety
type TabType = "personnel" | "inventory" | "visits";

export default function Analytics() {
  // Use the translation hook
  const { t } = useTranslation();

  // State management
  const [selectedPersonnel, setSelectedPersonnel] =
    useState<PersonnelWithMetrics | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>("personnel");
  
  // Filter states for each table type
  const [personnelFilters, setPersonnelFilters] = useState<PersonnelFilters>({
    dateRange: undefined,
    searchQuery: "",
    selectedService: "all",
    minRevenue: undefined,
    maxRevenue: undefined,
  });

  const [inventoryFilters, setInventoryFilters] = useState<InventoryFilters>({
    dateRange: undefined,
    searchQuery: "",
    minStock: undefined,
    maxStock: undefined,
    showLowStock: false,
    sortBy: "name",
    sortOrder: "asc",
  });

  const [visitFilters, setVisitFilters] = useState<VisitFilters>({
    dateRange: undefined,
    searchQuery: "",
    selectedService: "all",
    selectedPersonnel: "all",
    paymentType: "all",
    minRevenue: undefined,
    maxRevenue: undefined,
    sortBy: "date",
    sortOrder: "desc",
  });

  // Use our custom hooks with Redux
  const { loading: personnelLoading, get_personel_list_list } =
    usePersonel_e02ed2();
  const { loading: servicesLoading, get_services_list_list } =
    useServices_10cd39();
  const { get_visit_list_list } = useVisits();
  const { loading: paymentsLoading, get_payments_list_list } = usePayments();
  const { loading: itemsLoading, get_items_list_list } = useItems_691d50();

  // Get data from Redux store
  const personel_list = useAppSelector(
    (store) => store.personels
  ) as PersonelType[];
  const services_list = useAppSelector(
    (store) => store.services
  ) as ServicesType[];
  const visit_list = useAppSelector((store) => store.visits) as VisitType[];
  const payments_list = useAppSelector(
    (store) => store.payments
  ) as PaymentsType[];
  const items_list = useAppSelector((store) => store.items) as ItemsType[];

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
         get_personel_list_list();
         get_services_list_list();
         get_visit_list_list();
         get_payments_list_list();
         get_items_list_list();
        // Set animate in after data is loaded
        setAnimateIn(true);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update active filters count based on current tab's filters
  useEffect(() => {
    const currentFilters = getCurrentFilters();
    let count = 0;
    
    // Count common filters
    if (currentFilters.searchQuery) count++;
    if (currentFilters.dateRange?.from && currentFilters.dateRange?.to) count++;

    // Count tab-specific filters
    switch (activeTab) {
      case "personnel":
        if ((currentFilters as PersonnelFilters).selectedService !== "all") count++;
        if ((currentFilters as PersonnelFilters).minRevenue !== undefined) count++;
        if ((currentFilters as PersonnelFilters).maxRevenue !== undefined) count++;
        break;
      case "inventory":
        if ((currentFilters as InventoryFilters).minStock !== undefined) count++;
        if ((currentFilters as InventoryFilters).maxStock !== undefined) count++;
        if ((currentFilters as InventoryFilters).showLowStock) count++;
        if ((currentFilters as InventoryFilters).sortBy !== "name") count++;
        break;
      case "visits":
        if ((currentFilters as VisitFilters).selectedService !== "all") count++;
        if ((currentFilters as VisitFilters).selectedPersonnel !== "all") count++;
        if ((currentFilters as VisitFilters).paymentType !== "all") count++;
        if ((currentFilters as VisitFilters).minRevenue !== undefined) count++;
        if ((currentFilters as VisitFilters).maxRevenue !== undefined) count++;
        break;
    }
    
    setActiveFilters(count);
  }, [activeTab, personnelFilters, inventoryFilters, visitFilters]);

  // Extract visit items from the visits data structure
  const visitItems = useMemo(() => {
    console.log("Calculating visit items from", visit_list.length, "visits");
    const allVisitItems: Visit_itemType[] = [];
    visit_list.forEach((visit) => {
      if (visit.operations) {
        visit.operations.forEach((operation) => {
          if (operation.items) {
            operation.items.forEach((item) => {
              allVisitItems.push(item);
            });
          }
        });
      }
    });
    console.log("Total visit items:", allVisitItems.length);
    return allVisitItems;
  }, [visit_list]);

  // Calculate total metrics
  const totalVisits = useMemo(() => visit_list.length, [visit_list]);

  const totalItems = useMemo(
    () => items_list.reduce((total, item) => total + item.used, 0),
    [items_list]
  );

  const totalRevenue = useMemo(
    () => payments_list.reduce((total, payment) => total + payment.price, 0),
    [payments_list]
  );

  const totalPersonnelPayments = useMemo(
    () =>
      personel_list.reduce(
        (total, person) => total + (person.expense || 0),
        0
      ),
    [personel_list]
  );

  // Update filteredPersonnel to use personnelFilters
  const filteredPersonnel = useMemo(() => {
    console.log("Filtering personnel from", personel_list.length, "records");
    
    return personel_list.filter((person) => {
      // Filter by search query
      const matchesSearch =
        !personnelFilters.searchQuery ||
        person.name.toLowerCase().includes(personnelFilters.searchQuery.toLowerCase());

      // Filter by service
      const matchesService =
        personnelFilters.selectedService === "all" ||
        services_list.some(
          (service) =>
            service.personel?.some((p) => p.id === person.id) &&
            service.id.toString() === personnelFilters.selectedService
        );

      // Filter by date range
      let matchesDateRange = true;
      if (personnelFilters.dateRange?.from && personnelFilters.dateRange?.to) {
        const personVisits = visit_list.filter(
          (visit) =>
            visit.operations &&
            visit.operations.some(
              (op) =>
                op.service &&
                op.service.some(
                  (s) => s.personel?.some((p) => p.id === person.id)
                )
            )
        );

        matchesDateRange = personVisits.some(
          (visit) =>
            visit.operations &&
            visit.operations.some((op) => {
              if (!op.datetime) return false;
              const opDate = new Date(op.datetime);
              return isWithinInterval(opDate, {
                start: personnelFilters.dateRange!.from!,
                end: personnelFilters.dateRange!.to!,
              });
            })
        );
      }

      // Filter by revenue range
      const matchesRevenue =
        (!personnelFilters.minRevenue ||
          person.doctorExpense >= personnelFilters.minRevenue) &&
        (!personnelFilters.maxRevenue ||
          person.doctorExpense <= personnelFilters.maxRevenue);

      return matchesSearch && matchesService && matchesDateRange && matchesRevenue;
    });
  }, [
    personel_list,
    personnelFilters,
    services_list,
    visit_list,
  ]);

  // Calculate metrics for each personnel
  const personnelWithMetrics = useMemo(() => {
    console.log(
      "Calculating metrics for",
      filteredPersonnel.length,
      "personnel"
    );

    // Map personnel data directly since metrics are now part of PersonelType
    const result = filteredPersonnel.map((person) => {
      // Get services provided by this personnel
      const personServices = services_list.filter(
        (service) => service.personel?.some((p) => p.id === person.id)
      );

      return {
        ...person,
        services: personServices,
      };
    }).sort((a, b) => b.revenue - a.revenue); // Sort by revenue (highest first)

    return result;
  }, [filteredPersonnel, services_list]);

  // Calculate metrics for filtered personnel
  const filteredPersonnelWithMetrics = useMemo(() => {
    return personnelWithMetrics.filter(person =>
      filteredPersonnel.some(fp => fp.id === person.id)
    );
  }, [personnelWithMetrics, filteredPersonnel]);

  // Get current filters based on active tab
  const getCurrentFilters = () => {
    switch (activeTab) {
      case "personnel":
        return personnelFilters;
      case "inventory":
        return inventoryFilters;
      case "visits":
        return visitFilters;
    }
  };

  // Handle filter changes based on active tab
  const handleFilterChange = (
    filters: PersonnelFilters | InventoryFilters | VisitFilters
  ) => {
    switch (activeTab) {
      case "personnel":
        setPersonnelFilters(filters as PersonnelFilters);
        break;
      case "inventory":
        setInventoryFilters(filters as InventoryFilters);
        break;
      case "visits":
        setVisitFilters(filters as VisitFilters);
        break;
    }
  };

  // Reset filters for current tab
  const resetFilters = () => {
    switch (activeTab) {
      case "personnel":
        setPersonnelFilters({
          dateRange: undefined,
          searchQuery: "",
          selectedService: "all",
          minRevenue: undefined,
          maxRevenue: undefined,
        });
        break;
      case "inventory":
        setInventoryFilters({
          dateRange: undefined,
          searchQuery: "",
          minStock: undefined,
          maxStock: undefined,
          showLowStock: false,
          sortBy: "name",
          sortOrder: "asc",
        });
        break;
      case "visits":
        setVisitFilters({
          dateRange: undefined,
          searchQuery: "",
          selectedService: "all",
          selectedPersonnel: "all",
          paymentType: "all",
          minRevenue: undefined,
          maxRevenue: undefined,
          sortBy: "date",
          sortOrder: "desc",
        });
        break;
    }
  };

  // Check if any data is still loading
  const isDataLoading =
    personnelLoading || servicesLoading || paymentsLoading || itemsLoading;

  // Handle personnel click for details modal
  const handlePersonnelClick = (personnel: PersonnelWithMetrics) => {
    setSelectedPersonnel(personnel);
    setIsModalOpen(true);
  };

  return (
    <div
      className={`min-h-screen bg-base-100 transition-opacity duration-500 opacity-100`}
    >
      {/* Loading overlay */}
      {isDataLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-lg font-medium">{t("analytics.loading")}</p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto py-6 px-4 space-y-8">
        {/* Page header */}
        <div
          className={`flex justify-between items-center transition-all duration-500 ease-out ${
            animateIn ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t("analytics.analysis")}
            </h1>
            <p className="text-base-content/70 mt-1">
              {t("analytics.personnelAnalytics")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`btn btn-outline btn-sm gap-2 relative ${
                activeFilters > 0 ? "border-primary text-primary" : ""
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("analytics.filters")}
              {activeFilters > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <FilterSection
          filters={getCurrentFilters()}
          onFilterChange={handleFilterChange}
          services_list={services_list}
          personel_list={personel_list}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          activeFilters={activeFilters}
          resetFilters={resetFilters}
          applyFilters={() => setShowFilters(false)}
          tableType={activeTab}
        />

        {/* Summary Cards */}
        <div
          className={`transition-all duration-500 ease-out ${
            animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <SummaryCards
            totalVisits={totalVisits}
            totalItems={totalItems}
            totalRevenue={totalRevenue}
            totalPersonnelPayments={totalPersonnelPayments}
          />
        </div>

        {/* Tabs */}
        <div role="tablist" className="tabs tabs-boxed bg-base-200/50 p-1 justify-center">
          <button
            role="tab"
            className={`tab tab-lg gap-2 ${activeTab === "personnel" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("personnel")}
          >
            <Users className="w-4 h-4" />
            {t("analytics.personnel")}
          </button>
          <button
            role="tab"
            className={`tab tab-lg gap-2 ${activeTab === "inventory" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            <Package className="w-4 h-4" />
            {t("analytics.inventory")}
          </button>
          <button
            role="tab"
            className={`tab tab-lg gap-2 ${activeTab === "visits" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("visits")}
          >
            <Calendar className="w-4 h-4" />
            {t("analytics.visits")}
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Charts */}
          <div className="mb-6">
            {activeTab === "personnel" && (
              <PersonnelCharts
                personnelWithMetrics={filteredPersonnelWithMetrics}
              />
            )}
            {activeTab === "inventory" && (
              <InventoryCharts
                items_list={items_list}
              />
            )}
            {activeTab === "visits" && (
              <VisitsCharts
                visits={visit_list}
              />
            )}
          </div>

          {/* Tables */}
          {activeTab === "personnel" && (
            <PersonnelTable
              personnelWithMetrics={filteredPersonnelWithMetrics}
              filteredPersonnel={filteredPersonnelWithMetrics}
              personel_list={personel_list}
              onPersonnelClick={handlePersonnelClick}
            />
          )}
          {activeTab === "inventory" && (
            <InventoryTable
              items_list={items_list}
              animateIn={animateIn}
            />
          )}
          {activeTab === "visits" && (
            <VisitsTable
              visit_list={visit_list}
              services_list={services_list}
              personel_list={personel_list}
              animateIn={animateIn}
              filters={visitFilters}
            />
          )}
        </div>

        {/* Personnel Detail Modal */}
        <PersonnelModal
          selectedPersonnel={selectedPersonnel}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}
