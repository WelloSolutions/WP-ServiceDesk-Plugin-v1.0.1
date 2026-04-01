<?php
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

if (!function_exists('wello_servicedesk_api_render_support_page_editor')) {

    function wello_servicedesk_api_render_support_page_editor() {

        if (!current_user_can('manage_options')) {
            wp_die(
                esc_html__(
                    'You do not have sufficient permissions to access this page.',
                    'wello-servicedesk-api'
                )
            );
        }

        // Save the content if the form is submitted
		if (isset($_POST['wello_support_page_content_nonce'])) {

			$nonce = sanitize_text_field(
				wp_unslash($_POST['wello_support_page_content_nonce'])
			);

			if (wp_verify_nonce($nonce, 'wello_save_support_page_content')) {

				$content = isset($_POST['wello_support_page_content'])
					? wp_kses_post(
						wp_unslash($_POST['wello_support_page_content'])
					)
					: '';

				update_option('wello_support_page_content', $content);

				echo '<div class="notice notice-success"><p>' .
					esc_html__(
						'Support page content saved.',
						'wello-servicedesk-api'
					) .
				'</p></div>';
			}
		}

        $content = get_option('wello_support_page_content', '');
        ?>

        <div class="wrap">
            <h1>
                <?php echo esc_html__('Support Page Content', 'wello-servicedesk-api'); ?>
            </h1>

            <form method="post" style="margin-top: 20px;">
                <?php
                wp_nonce_field(
                    'wello_save_support_page_content',
                    'wello_support_page_content_nonce'
                );

                wp_editor(
                    $content,
                    'wello_support_page_content',
                    [
                        'textarea_name' => 'wello_support_page_content',
                        'media_buttons' => true,
                        'textarea_rows' => 15,
                        'teeny'         => false,
                    ]
                );
                ?>

                <p class="submit">
                    <button type="submit" class="button button-primary">
                        <?php echo esc_html__('Save Content', 'wello-servicedesk-api'); ?>
                    </button>
                </p>
            </form>
        </div>

        <?php
    }
}