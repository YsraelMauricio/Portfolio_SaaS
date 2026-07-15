<?php

namespace Database\Seeders;

use App\Models\Modifier;
use App\Models\ModifierGroup;
use App\Models\ProductType;
use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;

class QuoteEngineSeeder extends Seeder
{
    /**
     * Seed the quote engine tables with all categories, product types, and modifiers.
     */
    public function run(): void
    {
        // ─── Category 1: Web ───────────────────────────────────────────────────
        $web = ServiceCategory::create([
            'name' => 'Web',
            'slug' => 'web',
            'bolivia_only' => false,
            'sort_order' => 1,
            'active' => true,
        ]);

        $landingPage = ProductType::create([
            'service_category_id' => $web->id,
            'name' => 'Landing page',
            'slug' => 'landing-page',
            'base_price_usd' => 350.00,
            'base_days_min' => 5,
            'base_days_max' => 5,
            'is_floor_not_ceiling' => false,
            'sort_order' => 1,
            'active' => true,
        ]);

        $wordpressBudget = ProductType::create([
            'service_category_id' => $web->id,
            'name' => 'WordPress site (económico)',
            'slug' => 'wordpress-budget',
            'base_price_usd' => 200.00,
            'base_days_min' => 3,
            'base_days_max' => 5,
            'is_floor_not_ceiling' => false,
            'sort_order' => 2,
            'active' => true,
        ]);

        $webBasic = ProductType::create([
            'service_category_id' => $web->id,
            'name' => 'Web completa — básica',
            'slug' => 'web-basic',
            'base_price_usd' => 800.00,
            'base_days_min' => 15,
            'base_days_max' => 15,
            'is_floor_not_ceiling' => false,
            'sort_order' => 3,
            'active' => true,
        ]);

        $webBusinessLogic = ProductType::create([
            'service_category_id' => $web->id,
            'name' => 'Web completa — con lógica de negocio',
            'slug' => 'web-business-logic',
            'base_price_usd' => 2500.00,
            'base_days_min' => 25,
            'base_days_max' => 30,
            'is_floor_not_ceiling' => false,
            'sort_order' => 4,
            'active' => true,
        ]);

        $ecommerce = ProductType::create([
            'service_category_id' => $web->id,
            'name' => 'E-commerce',
            'slug' => 'ecommerce',
            'base_price_usd' => 3000.00,
            'base_days_min' => 20,
            'base_days_max' => 25,
            'is_floor_not_ceiling' => false,
            'sort_order' => 5,
            'active' => true,
        ]);

        $saas = ProductType::create([
            'service_category_id' => $web->id,
            'name' => 'SaaS',
            'slug' => 'saas',
            'base_price_usd' => 5000.00,
            'base_days_min' => 30,
            'base_days_max' => 30,
            'is_floor_not_ceiling' => true,
            'sort_order' => 6,
            'active' => true,
        ]);

        // Modifier groups for Web
        $alcanceTecnico = ModifierGroup::create([
            'product_type_id' => null,
            'name' => 'Alcance técnico',
            'allows_multiple' => false,
            'sort_order' => 1,
        ]);

        Modifier::create([
            'modifier_group_id' => $alcanceTecnico->id,
            'name' => 'Frontend only',
            'price_impact_usd' => -100.00,
            'time_impact_days' => 0,
            'impact_type' => 'additive',
            'sort_order' => 1,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $alcanceTecnico->id,
            'name' => 'Full stack',
            'price_impact_usd' => 500.00,
            'time_impact_days' => 5,
            'impact_type' => 'additive',
            'sort_order' => 2,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $alcanceTecnico->id,
            'name' => 'Full stack + DevOps',
            'price_impact_usd' => 1000.00,
            'time_impact_days' => 7,
            'impact_type' => 'additive',
            'sort_order' => 3,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $alcanceTecnico->id,
            'name' => 'APIs only',
            'price_impact_usd' => -200.00,
            'time_impact_days' => 0,
            'impact_type' => 'additive',
            'sort_order' => 4,
            'active' => true,
        ]);

        $nivelUx = ModifierGroup::create([
            'product_type_id' => null,
            'name' => 'Nivel de UX',
            'allows_multiple' => false,
            'sort_order' => 2,
        ]);

        Modifier::create([
            'modifier_group_id' => $nivelUx->id,
            'name' => 'Template/simple',
            'price_impact_usd' => 0.00,
            'time_impact_days' => 0,
            'impact_type' => 'additive',
            'sort_order' => 1,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $nivelUx->id,
            'name' => 'Diseño personalizado',
            'price_impact_usd' => 300.00,
            'time_impact_days' => 2,
            'impact_type' => 'additive',
            'sort_order' => 2,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $nivelUx->id,
            'name' => 'Premium',
            'price_impact_usd' => 600.00,
            'time_impact_days' => 4,
            'impact_type' => 'additive',
            'sort_order' => 3,
            'active' => true,
        ]);

        $extras = ModifierGroup::create([
            'product_type_id' => null,
            'name' => 'Extras',
            'allows_multiple' => true,
            'sort_order' => 3,
        ]);

        Modifier::create([
            'modifier_group_id' => $extras->id,
            'name' => 'Panel admin básico',
            'price_impact_usd' => 200.00,
            'time_impact_days' => 2,
            'impact_type' => 'additive',
            'sort_order' => 1,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $extras->id,
            'name' => 'Blog',
            'price_impact_usd' => 150.00,
            'time_impact_days' => 2,
            'impact_type' => 'additive',
            'sort_order' => 2,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $extras->id,
            'name' => 'Multilenguaje',
            'price_impact_usd' => 300.00,
            'time_impact_days' => 3,
            'impact_type' => 'additive',
            'sort_order' => 3,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $extras->id,
            'name' => 'SEO inicial',
            'price_impact_usd' => 100.00,
            'time_impact_days' => 1,
            'impact_type' => 'additive',
            'sort_order' => 4,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $extras->id,
            'name' => 'Configuración y depliegue inicial',
            'price_impact_usd' => 150.00,
            'time_impact_days' => 1,
            'impact_type' => 'additive',
            'sort_order' => 5,
            'active' => true,
        ]);

        // ─── Category 2: Mobile ────────────────────────────────────────────────
        $mobile = ServiceCategory::create([
            'name' => 'Mobile',
            'slug' => 'mobile',
            'bolivia_only' => false,
            'sort_order' => 2,
            'active' => true,
        ]);

        $nativeApp = ProductType::create([
            'service_category_id' => $mobile->id,
            'name' => 'App nativa (Android o iOS)',
            'slug' => 'native-app',
            'base_price_usd' => 3000.00,
            'base_days_min' => 20,
            'base_days_max' => 20,
            'is_floor_not_ceiling' => false,
            'sort_order' => 1,
            'active' => true,
        ]);

        $flutterApp = ProductType::create([
            'service_category_id' => $mobile->id,
            'name' => 'App Flutter (ambas plataformas)',
            'slug' => 'flutter-app',
            'base_price_usd' => 4000.00,
            'base_days_min' => 25,
            'base_days_max' => 25,
            'is_floor_not_ceiling' => false,
            'sort_order' => 2,
            'active' => true,
        ]);

        // Modifier groups for Mobile
        $targetOs = ModifierGroup::create([
            'product_type_id' => null,
            'name' => 'Target OS',
            'allows_multiple' => false,
            'sort_order' => 1,
        ]);

        Modifier::create([
            'modifier_group_id' => $targetOs->id,
            'name' => 'Android',
            'price_impact_usd' => 0.00,
            'time_impact_days' => 0,
            'impact_type' => 'additive',
            'sort_order' => 1,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $targetOs->id,
            'name' => 'iOS',
            'price_impact_usd' => 0.00,
            'time_impact_days' => 0,
            'impact_type' => 'additive',
            'sort_order' => 2,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $targetOs->id,
            'name' => 'Android + iOS',
            'price_impact_usd' => 500.00,
            'time_impact_days' => 5,
            'impact_type' => 'additive',
            'sort_order' => 3,
            'active' => true,
        ]);

        // ─── Category 3: Desktop ───────────────────────────────────────────────
        $desktop = ServiceCategory::create([
            'name' => 'Desktop',
            'slug' => 'desktop',
            'bolivia_only' => false,
            'sort_order' => 3,
            'active' => true,
        ]);

        $desktopCrossPlatform = ProductType::create([
            'service_category_id' => $desktop->id,
            'name' => 'App escritorio — Electron/Tauri',
            'slug' => 'desktop-cross-platform',
            'base_price_usd' => 2500.00,
            'base_days_min' => 15,
            'base_days_max' => 15,
            'is_floor_not_ceiling' => false,
            'sort_order' => 1,
            'active' => true,
        ]);

        $desktopNative = ProductType::create([
            'service_category_id' => $desktop->id,
            'name' => 'App escritorio — nativa',
            'slug' => 'desktop-native',
            'base_price_usd' => 5000.00,
            'base_days_min' => 25,
            'base_days_max' => 30,
            'is_floor_not_ceiling' => false,
            'sort_order' => 2,
            'active' => true,
        ]);

        // Modifier groups for Desktop
        $platform = ModifierGroup::create([
            'product_type_id' => null,
            'name' => 'Platform',
            'allows_multiple' => false,
            'sort_order' => 1,
        ]);

        Modifier::create([
            'modifier_group_id' => $platform->id,
            'name' => 'Windows (C# .NET)',
            'price_impact_usd' => 0.00,
            'time_impact_days' => 0,
            'impact_type' => 'additive',
            'sort_order' => 1,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $platform->id,
            'name' => 'macOS (Swift/SwiftUI)',
            'price_impact_usd' => 0.00,
            'time_impact_days' => 0,
            'impact_type' => 'additive',
            'sort_order' => 2,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $platform->id,
            'name' => 'Multiplataforma (Tauri/Electron)',
            'price_impact_usd' => 0.00,
            'time_impact_days' => 0,
            'impact_type' => 'additive',
            'sort_order' => 3,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $platform->id,
            'name' => 'Desktop + móvil (Flutter Desktop)',
            'price_impact_usd' => 500.00,
            'time_impact_days' => 5,
            'impact_type' => 'additive',
            'sort_order' => 4,
            'active' => true,
        ]);

        // ─── Category 4: Maintenance & modifications ───────────────────────────
        $maintenance = ServiceCategory::create([
            'name' => 'Maintenance & modifications',
            'slug' => 'maintenance',
            'bolivia_only' => false,
            'sort_order' => 4,
            'active' => true,
        ]);

        $modification = ProductType::create([
            'service_category_id' => $maintenance->id,
            'name' => 'Modificación o mantenimiento',
            'slug' => 'modification',
            'base_price_usd' => 100.00,
            'base_days_min' => 1,
            'base_days_max' => 3,
            'is_floor_not_ceiling' => false,
            'sort_order' => 1,
            'active' => true,
        ]);

        // Modifier groups for Maintenance
        $tamanoCambio = ModifierGroup::create([
            'product_type_id' => null,
            'name' => 'Tamaño del cambio',
            'allows_multiple' => false,
            'sort_order' => 1,
        ]);

        Modifier::create([
            'modifier_group_id' => $tamanoCambio->id,
            'name' => 'Menor',
            'price_impact_usd' => 0.00,
            'time_impact_days' => 1,
            'impact_type' => 'additive',
            'sort_order' => 1,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $tamanoCambio->id,
            'name' => 'Mediano',
            'price_impact_usd' => 200.00,
            'time_impact_days' => 3,
            'impact_type' => 'additive',
            'sort_order' => 2,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $tamanoCambio->id,
            'name' => 'Mayor',
            'price_impact_usd' => 500.00,
            'time_impact_days' => 7,
            'impact_type' => 'additive',
            'sort_order' => 3,
            'active' => true,
        ]);

        $urgencia = ModifierGroup::create([
            'product_type_id' => null,
            'name' => 'Urgencia',
            'allows_multiple' => false,
            'sort_order' => 2,
        ]);

        Modifier::create([
            'modifier_group_id' => $urgencia->id,
            'name' => 'Normal',
            'price_impact_usd' => 0.00,
            'time_impact_days' => 0,
            'impact_type' => 'additive',
            'sort_order' => 1,
            'active' => true,
        ]);

        Modifier::create([
            'modifier_group_id' => $urgencia->id,
            'name' => 'Urgente',
            'price_impact_usd' => 100.00,
            'time_impact_days' => -2,
            'impact_type' => 'additive',
            'sort_order' => 2,
            'active' => true,
        ]);

        // ─── Category 5: Technical Support (Bolivia only) ──────────────────────
        $technicalSupport = ServiceCategory::create([
            'name' => 'Technical Support',
            'slug' => 'technical-support',
            'bolivia_only' => true,
            'sort_order' => 5,
            'active' => true,
        ]);

        ProductType::create([
            'service_category_id' => $technicalSupport->id,
            'name' => 'Mantenimiento general de equipo',
            'slug' => 'hardware-maintenance',
            'base_price_usd' => 30.00,
            'base_days_min' => 1,
            'base_days_max' => 2,
            'is_floor_not_ceiling' => false,
            'sort_order' => 1,
            'active' => true,
        ]);

        ProductType::create([
            'service_category_id' => $technicalSupport->id,
            'name' => 'Instalación y configuración de software',
            'slug' => 'software-installation',
            'base_price_usd' => 5.00,
            'base_days_min' => 1,
            'base_days_max' => 1,
            'is_floor_not_ceiling' => false,
            'sort_order' => 2,
            'active' => true,
        ]);
    }
}
