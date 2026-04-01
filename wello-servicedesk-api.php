<?php
/*
 * Plugin Name: Wello ServiceDesk API
 * Description: Service Desk for field service companies.
 * Version: 1.0.0
 * Author: Wello
 * Author URI: https://wello.solutions/
 * Donate Link: https://wello.solutions/
 * Text Domain: wello-servicedesk-api
 * Domain Path: /languages
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */


if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Define plugin constants
define('WELLO_SERVICEDESK_VERSION', '1.0.0');
define('WELLO_SERVICEDESK_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WELLO_SERVICEDESK_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WELLO_SERVICEDESK_TEXT_DOMAIN', 'wello-servicedesk-api');
define('WELLO_SERVICEDESK_API_URL', 'https://servicedeskapi.wello.solutions');

// Helper function to safely get option with type casting
function wello_get_option($option, $default = '', $type = 'string')
{
    $value = get_option($option, $default);
    
    switch ($type) {
        case 'url':
            return esc_url($value);
        case 'hex_color':
            return sanitize_hex_color($value);
        case 'html':
            return wp_kses_post($value);
        case 'text':
        default:
            return sanitize_text_field($value);
    }
}

// Helper function to safely output form inputs
function wello_form_input($name, $type = 'text', $value = '', $class = '')
{
    echo '<input type="' . esc_attr($type) . '" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '" class="' . esc_attr($class) . '">';
}

/**
 * Enqueue Frontend Scripts and Styles (only on frontend)
 * 
 * Uses glob() to find versioned build files and passes sanitized settings
 * to the React app via wp_localize_script for secure configuration.
 *
 * @since 1.0.0
 */
function wello_servicedesk_enqueue_scripts()
{
    // Only enqueue on frontend, not admin
    if (is_admin()) {
        return;
    }

    $plugin_dir_url = WELLO_SERVICEDESK_PLUGIN_URL;
    $plugin_dir_path = WELLO_SERVICEDESK_PLUGIN_DIR;
    $script_handle = 'wello-servicedesk-script';
    $style_handle = 'wello-servicedesk-style';

    // Enqueue CSS
    $css_dir = $plugin_dir_path . 'build/static/css/';
    if (is_dir($css_dir)) {
        // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
        $css_files = @glob($css_dir . '*.css');
        if (!empty($css_files) && is_array($css_files)) {
            $css_file_path = reset($css_files);
            if (file_exists($css_file_path)) {
                $css_file_url = $plugin_dir_url . 'build/static/css/' . basename($css_file_path);
                $css_version = filemtime($css_file_path);
                wp_enqueue_style(
                    $style_handle,
                    $css_file_url,
                    [],
                    $css_version
                );
            }
        }
    }

    // Enqueue JS
    $js_dir = $plugin_dir_path . 'build/static/js/';
    if (is_dir($js_dir)) {
        // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
        $js_files = @glob($js_dir . 'main.*.js');
        if (!empty($js_files) && is_array($js_files)) {
            $js_file_path = reset($js_files);
            if (file_exists($js_file_path)) {
                $js_file_url = $plugin_dir_url . 'build/static/js/' . basename($js_file_path);
                $js_version = filemtime($js_file_path);
                
                wp_register_script(
                    $script_handle,
                    $js_file_url,
                    ['wp-element'],
                    $js_version,
                    true
                );
                wp_enqueue_script($script_handle);

                // Pass sanitized settings to React via wp_localize_script
                $settings = [
                    'token' => wello_get_option('wello_servicedesk_token', '', 'text'),
                    'logo_primary' => wello_get_option('wello_logo_primary', '', 'url'),
                    'logo_secondary' => wello_get_option('wello_logo_secondary', '', 'url'),
                    'color_primary' => wello_get_option('wello_color_primary', '#003327', 'hex_color'),
                    'background_image' => wello_get_option('wello_bg_image', '', 'url'),
                    'support_page_content' => wello_get_option('wello_support_page_content', '', 'html'),
                ];

                wp_localize_script($script_handle, 'welloServiceDesk', $settings);
            }
        }
    }
}
add_action('wp_enqueue_scripts', 'wello_servicedesk_enqueue_scripts', 999);

// Register and Include Custom Page Template
function wello_servicedesk_template($templates)
{
    $templates['wello-servicedesk-template.php'] = __('Wello Service Desk Template', 'wello-servicedesk-api');
    return $templates;
}
add_filter('theme_page_templates', 'wello_servicedesk_template');

function wello_servicedesk_template_include($template)
{
    if (get_page_template_slug() === 'wello-servicedesk-template.php') {
        $template = plugin_dir_path(__FILE__) . 'template/wello-servicedesk-template.php';
    }
    return $template;
}
add_filter('template_include', 'wello_servicedesk_template_include');

// Create the Service Desk Page on Plugin Activation
function wello_servicedesk_create_page()
{
    $page_slug = 'service-desk';
    if (null === get_page_by_path($page_slug)) {
        wp_insert_post([
            'post_title'    => __('Service Desk', 'wello-servicedesk-api'),
            'post_name'     => $page_slug,
            'post_content'  => '',
            'post_status'   => 'publish',
            'post_type'     => 'page',
            'meta_input'    => ['_wp_page_template' => 'wello-servicedesk-template.php'],
        ]);
    }
}
register_activation_hook(__FILE__, 'wello_servicedesk_create_page');

// Rewrite Rule for Custom Page
function wello_servicedesk_rewrite_rule()
{
    add_rewrite_rule('^service-desk(/.*)?$', 'index.php?pagename=service-desk', 'top');
}
add_action('init', 'wello_servicedesk_rewrite_rule');

function wello_servicedesk_flush_rewrite_rules()
{
    wello_servicedesk_rewrite_rule();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'wello_servicedesk_flush_rewrite_rules');

// Admin Menu and Settings Page
function wello_servicedesk_admin_menu()
{
    add_menu_page(
        __('Service Desk Settings', 'wello-servicedesk-api'),
        __('Service Desk', 'wello-servicedesk-api'),
        'manage_options',
        'wello-servicedesk-settings',
        'wello_servicedesk_settings_page'
    );

    add_submenu_page(
        'wello-servicedesk-settings',
        __('Generate Access Token', 'wello-servicedesk-api'),
        __('Generate Token', 'wello-servicedesk-api'),
        'manage_options',
        'wello-servicedesk-generate-token', // ← the slug
        'render_access_token_page'
    );

    add_submenu_page(
        'wello-servicedesk-settings',
        __('Support Page Content', 'wello-servicedesk-api'),
        __('Support Page', 'wello-servicedesk-api'),
        'manage_options',
        'wello-servicedesk-support-page',
        'wello_servicedesk_support_page'
    );
}
add_action('admin_menu', 'wello_servicedesk_admin_menu');

require_once plugin_dir_path(__FILE__) . '/wello_servicedesk_generate_token_page.php';

function wello_servicedesk_settings_page()
{
    echo '<div class="wrap"><h1>' . esc_html__('Service Desk Settings', 'wello-servicedesk-api') . '</h1><form method="post" action="' . esc_attr(admin_url('options.php')) . '">';
    settings_fields('wello_servicedesk_options_group');
    do_settings_sections('wello-servicedesk-settings');
    submit_button();
    echo '</form></div>';
}

// Register Settings Fields
function wello_servicedesk_settings_init()
{
    $fields = [
        'wello_servicedesk_token',
        'wello_logo_primary',
        'wello_logo_secondary',
        'wello_color_primary',
        'wello_bg_image',
        'wello_access_token',
        'wello_support_page_content',
    ];

    // Define sanitizers and types for each option
    $sanitizers = [
        'wello_servicedesk_token'   => 'sanitize_text_field',
        'wello_logo_primary'        => 'esc_url_raw',
        'wello_logo_secondary'      => 'esc_url_raw',
        'wello_color_primary'       => 'sanitize_hex_color',
        'wello_bg_image'            => 'esc_url_raw',
        'wello_access_token'        => 'sanitize_text_field',
        'wello_support_page_content' => 'wp_kses_post',
    ];

    $types = [
        'wello_servicedesk_token'   => 'string',
        'wello_logo_primary'        => 'string',
        'wello_logo_secondary'      => 'string',
        'wello_color_primary'       => 'string',
        'wello_bg_image'            => 'string',
        'wello_access_token'        => 'string',
        'wello_support_page_content' => 'string',
    ];

    // Register each setting with explicit type and sanitization callback
    foreach ($fields as $field) {
        register_setting(
            'wello_servicedesk_options_group',
            $field,
            array(
                'type'              => $types[$field] ?? 'string',
                'sanitize_callback' => $sanitizers[$field] ?? 'sanitize_text_field',
            )
        );
    }

    // Settings section
    add_settings_section(
        'wello_servicedesk_section',
        __('General Settings', 'wello-servicedesk-api'),
        null,
        'wello-servicedesk-settings'
    );

    // Settings fields
    add_settings_field(
        'wello_servicedesk_token',
        __('Access Token', 'wello-servicedesk-api'),
        'wello_servicedesk_token_callback',
        'wello-servicedesk-settings',
        'wello_servicedesk_section'
    );

    add_settings_field(
        'wello_logo_primary',
        __('Primary Logo', 'wello-servicedesk-api'),
        'wello_logo_primary_callback',
        'wello-servicedesk-settings',
        'wello_servicedesk_section'
    );

    add_settings_field(
        'wello_logo_secondary',
        __('Secondary Logo', 'wello-servicedesk-api'),
        'wello_logo_secondary_callback',
        'wello-servicedesk-settings',
        'wello_servicedesk_section'
    );

    add_settings_field(
        'wello_color_primary',
        __('Primary Color', 'wello-servicedesk-api'),
        'wello_color_primary_callback',
        'wello-servicedesk-settings',
        'wello_servicedesk_section'
    );

    add_settings_field(
        'wello_bg_image',
        __('Main Page Banner', 'wello-servicedesk-api'),
        'wello_bg_image_callback',
        'wello-servicedesk-settings',
        'wello_servicedesk_section'
    );
}
add_action('admin_init', 'wello_servicedesk_settings_init');

// Input Field Callbacks
function wello_servicedesk_token_callback()
{
    // Check if a token was submitted via POST and update the option
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['access_token'])) {
        if (
            ! isset($_POST['wello_set_access_token_nonce_field'])
            || ! wp_verify_nonce(
                sanitize_text_field(wp_unslash($_POST['wello_set_access_token_nonce_field'])),
                'wello_set_access_token_nonce'
            )
        ) {

            wp_die(esc_html__('Security check failed.', 'wello-servicedesk-api'));
        }
        update_option('wello_servicedesk_token', sanitize_text_field(wp_unslash($_POST['access_token'])));
    }

    // Retrieve the latest token
    $token = esc_attr(get_option('wello_servicedesk_token'));
    $generate_url = admin_url('admin.php?page=wello-servicedesk-generate-token');

    echo '<input type="text" readonly name="wello_servicedesk_token" value="' . esc_attr($token) . '" class="regular-text">';
    echo ' <a href="' . esc_url($generate_url) . '" class="button button-secondary">' . esc_html__('Generate Access Token', 'wello-servicedesk-api') . '</a>';
    echo '<p><small>' . esc_html__('Generate your access token, then save your changes to enable secure access and apply your configuration.', 'wello-servicedesk-api') . '</small></p>';
}

function wello_logo_primary_callback()
{
    $wello_logo_primary = esc_url(get_option('wello_logo_primary', ''));
    echo '<input type="text" name="wello_logo_primary" value="' . esc_attr($wello_logo_primary) . '" class="regular-text" id="wello_logo_primary">';
    echo ' <button type="button" class="button upload-media" data-target="wello_logo_primary">' . esc_html__('Select Image', 'wello-servicedesk-api') . '</button>';
    echo '<p><small>' . esc_html__('Image should be maximum 2MB.', 'wello-servicedesk-api') . '</small></p>';

    if (!empty($wello_logo_primary)) {
        echo '<div style="margin-top:10px;"><img src="' . esc_attr($wello_logo_primary) . '" alt="' . esc_attr(__('Logo Primary', 'wello-servicedesk-api')) . '" style="max-width:150px;height:auto;border:1px solid #ccc;padding:5px;"></div>';
    }
}
function wello_logo_secondary_callback()
{
    $wello_logo_secondary = esc_url(get_option('wello_logo_secondary', ''));
    echo '<input type="text" name="wello_logo_secondary" value="' . esc_attr($wello_logo_secondary) . '" class="regular-text" id="wello_logo_secondary">';
    echo ' <button type="button" class="button upload-media" data-target="wello_logo_secondary">' . esc_html__('Select Image', 'wello-servicedesk-api') . '</button>';
    echo '<p><small>' . esc_html__('Image should be maximum 2MB.', 'wello-servicedesk-api') . '</small></p>';

    if (!empty($wello_logo_secondary)) {
        echo '<div style="margin-top:10px;"><img src="' . esc_attr($wello_logo_secondary) . '" alt="' . esc_attr(__('Logo Secondary', 'wello-servicedesk-api')) . '" style="max-width:150px;height:auto;border:1px solid #ccc;padding:5px;"></div>';
    }
}

function wello_color_primary_callback()
{
    $wello_color_primary = esc_attr(get_option('wello_color_primary', '#003327'));
    echo '<input type="color" name="wello_color_primary" value="' . esc_attr($wello_color_primary) . '" id="wello_color_primary">';
    echo '<p><small>' . esc_html__('Select the primary color for the service desk.', 'wello-servicedesk-api') . '</small></p>';
}

function wello_bg_image_callback()
{
    $wello_bg_image = esc_url(get_option('wello_bg_image', ''));
    echo '<input type="text" name="wello_bg_image" value="' . esc_attr($wello_bg_image) . '" class="regular-text" id="wello_bg_image">';
    echo ' <button type="button" class="button upload-media" data-target="wello_bg_image">' . esc_html__('Select Image', 'wello-servicedesk-api') . '</button>';
    echo '<p><small>' . esc_html__('Image should be maximum 2MB.', 'wello-servicedesk-api') . '</small></p>';

    if (!empty($wello_bg_image)) {
        echo '<div style="margin-top:10px;"><img src="' . esc_attr($wello_bg_image) . '" alt="' . esc_attr(__('Background Image', 'wello-servicedesk-api')) . '" style="max-width:150px;height:auto;border:1px solid #ccc;padding:5px;"></div>';
    }
}

/**
 * Enqueue Media Uploader for Admin
 * 
 * @since 1.0.0
 */
function wello_enqueue_media_uploader()
{
    // Only enqueue on admin pages
    if (!is_admin()) {
        return;
    }

    wp_enqueue_media();
    
    $media_script_path = WELLO_SERVICEDESK_PLUGIN_DIR . 'js/wello-media.js';
    if (file_exists($media_script_path)) {
        wp_enqueue_script(
            'wello-media-uploader',
            WELLO_SERVICEDESK_PLUGIN_URL . 'js/wello-media.js',
            ['jquery'],
            filemtime($media_script_path),
            true
        );
    }
}
add_action('admin_enqueue_scripts', 'wello_enqueue_media_uploader');

//////////////////////////////////////////
function wello_keep_plugin_styles_only()
{

    if (is_admin()) {
        return;
    }

    if (get_page_template_slug(get_queried_object_id()) === 'wello-servicedesk-template.php') {

        // Keep plugin style
        $allowed_styles = ['wello-servicedesk-style'];

        global $wp_styles;

        if (!empty($wp_styles->queue)) {

            foreach ($wp_styles->queue as $handle) {

                if (!in_array($handle, $allowed_styles, true)) {
                    wp_dequeue_style($handle);
                    wp_deregister_style($handle);
                }
            }
        }
    }
}
add_action('wp_enqueue_scripts', 'wello_keep_plugin_styles_only', 999);


function wello_servicedesk_api_hide_admin_bar_for_template()
{
    if (is_page_template('wello-servicedesk-template.php')) {
        return false;
    }
    return true;
}
add_filter('show_admin_bar', 'wello_servicedesk_api_hide_admin_bar_for_template');

function wello_servicedesk_api_support_page()
{
    include plugin_dir_path(__FILE__) . 'support-page-editor.php';
    render_support_page_editor();
}
