<?php
if (!defined('ABSPATH')) {
    exit;
}

function wello_servicedesk_api_render_access_token_page() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'wello-servicedesk-api'));
    }

    $error_msg = '';
    $success_msg = '';
    $access_token = get_option('wello_access_token', '');

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST') {

        // Request OTP
        if (isset($_POST['request_otp'])) {

    // Verify nonce safely
    if (!isset($_POST['request_otp_nonce_field'])) {

        $error_msg = __('Security check failed.', 'wello-servicedesk-api');

    } else {

        $nonce = sanitize_text_field(
            wp_unslash($_POST['request_otp_nonce_field'])
        );

        if (!wp_verify_nonce($nonce, 'request_otp_nonce')) {

            $error_msg = __('Security check failed.', 'wello-servicedesk-api');

        } else {

            // Sanitize username safely
            $username = isset($_POST['wello_username'])
                ? sanitize_text_field(
                    wp_unslash($_POST['wello_username'])
                )
                : '';

            // Sanitize password safely
            $password = isset($_POST['wello_password'])
                ? sanitize_text_field(
                    wp_unslash($_POST['wello_password'])
                )
                : '';

            $response = wp_remote_post(
                WELLO_SERVICEDESK_API_URL . '/api/Authentication/login',
                [
                    'headers' => [
                        'Content-Type' => 'application/json',
                    ],
                    'body'    => wp_json_encode([
                        'useremail' => $username,
                        'password'  => $password,
                    ]),
                    'timeout' => 20,
                ]
            );

            if (is_wp_error($response)) {

                $error_msg = __('Connection error. Please try again.', 'wello-servicedesk-api');

            } else {

                $code = wp_remote_retrieve_response_code($response);
                $body = json_decode(
                    wp_remote_retrieve_body($response),
                    true
                );

                if ($code === 403 && isset($body['error']) && $body['error'] === 'forbidden') {

                    $error_msg = sanitize_text_field(
                        $body['message'] ??
                        __('Thank you for your interest in the Wello Service desk plugin. You need to be an administrator to set up this plugin.', 'wello-servicedesk-api')
                    );

                } elseif ($code === 401 && isset($body['error']) && $body['error'] === 'invalid_credentials') {

                    $error_msg = sanitize_text_field(
                        $body['message'] ??
                        __('Email or password not valid. Please try again. You can try 3 times.', 'wello-servicedesk-api')
                    );

                } elseif ($code !== 200 && isset($body['error'])) {

                    $error_msg = sanitize_text_field(
                        $body['message'] ??
                        __('An error occurred', 'wello-servicedesk-api')
                    );

                } elseif (!empty($body['otp_token'])) {

                    set_transient(
                        'wello_otp_token',
                        sanitize_text_field($body['otp_token']),
                        15 * MINUTE_IN_SECONDS
                    );

                    $success_msg = sanitize_text_field(
                        $body['message'] ??
                        __('OTP requested successfully.', 'wello-servicedesk-api')
                    );

                } else {

                    $error_msg = '<pre>' .
                        esc_html(
                            wp_json_encode($body, JSON_PRETTY_PRINT)
                        ) .
                    '</pre>';
                }
            }
        }
    }
}

        // Confirm OTP
        if (isset($_POST['confirm_otp'])) {

    // Check nonce exists
    if (!isset($_POST['confirm_otp_nonce_field'])) {

        $error_msg = __('Security check failed.', 'wello-servicedesk-api');

    } else {

        $nonce = sanitize_text_field(
            wp_unslash($_POST['confirm_otp_nonce_field'])
        );

        if (!wp_verify_nonce($nonce, 'confirm_otp_nonce')) {

            $error_msg = __('Security check failed.', 'wello-servicedesk-api');

        } else {

            // Safely get OTP token
            $otp_token = isset($_POST['otp_token'])
                ? sanitize_text_field(
                    wp_unslash($_POST['otp_token'])
                )
                : '';

            // Safely get OTP code
            $otp_code = isset($_POST['wello_otp_code'])
                ? sanitize_text_field(
                    wp_unslash($_POST['wello_otp_code'])
                )
                : '';

            $response = wp_remote_post(
                WELLO_SERVICEDESK_API_URL . '/api/Authentication/confirm-otp',
                [
                    'headers' => [
                        'Content-Type' => 'application/json',
                    ],
                    'body'    => wp_json_encode([
                        'otp_token' => $otp_token,
                        'otp_code'  => $otp_code,
                    ]),
                    'timeout' => 20,
                ]
            );

            if (is_wp_error($response)) {

                $error_msg = __('Connection error. Please try again.', 'wello-servicedesk-api');

            } else {

                $code = wp_remote_retrieve_response_code($response);
                $body = json_decode(
                    wp_remote_retrieve_body($response),
                    true
                );

                if ($code !== 200) {

                    if (isset($body['error']) && $body['error'] === 'invalid_credentials') {

                        $error_msg = __('Invalid OTP code.', 'wello-servicedesk-api');

                    } elseif (isset($body['error']) && $body['error'] === 'max_retry_exceeded') {

                        $error_msg = __('Max attempts reached. Try again in 24 hours.', 'wello-servicedesk-api');

                        $error_msg .= ' ' . sprintf(
							/* translators: %s: Number of remaining attempts. */
							esc_html__('Attempts left: %s.', 'wello-servicedesk-api'),
							isset($body['nb_retry'])
								? intval($body['nb_retry'])
								: esc_html__('Unknown', 'wello-servicedesk-api')
						);

                    } else {

                        $error_msg = __('OTP verification failed.', 'wello-servicedesk-api');
                    }

                } else {

                    if (!empty($body['access_token'])) {

                        $access_token = sanitize_text_field($body['access_token']);

                        update_option('wello_access_token', $access_token);
                        delete_transient('wello_otp_token');

                        $success_msg = sanitize_text_field(
                            $body['message'] ??
                            __('Access token generated successfully.', 'wello-servicedesk-api')
                        );

                    } else {

                        $error_msg = __('Unexpected server response.', 'wello-servicedesk-api');
                    }
                }
            }
        }
    }
}
    }

    $otp_token = get_transient('wello_otp_token');
    ?>

    <div class="wrap">
    <h1><?php echo esc_html__('Wello Service Desk - Access Token Setup', 'wello-servicedesk-api'); ?></h1>

    <?php
    // Handle clear access token
    if (isset($_POST['clear_access_token'])) {

    if (!isset($_POST['clear_access_token_nonce_field'])) {

        $error_msg = __(
            'Security check failed while clearing the token.',
            'wello-servicedesk-api'
        );

    } else {

        $nonce = sanitize_text_field(
            wp_unslash($_POST['clear_access_token_nonce_field'])
        );

        if (!wp_verify_nonce($nonce, 'clear_access_token_nonce')) {

            $error_msg = __(
                'Security check failed while clearing the token.',
                'wello-servicedesk-api'
            );

        } else {

            delete_option('wello_access_token');
            delete_transient('wello_otp_token');

            $access_token = '';

            $success_msg = __(
                'Access token has been cleared successfully.',
                'wello-servicedesk-api'
            );

            // Better than meta refresh (recommended)
            wp_safe_redirect(add_query_arg('token_cleared', '1'));
            exit;
        }
    }
}
    ?>

    <?php if (!empty($access_token)) : ?>
        <?php if ($success_msg): ?>
            <div class="notice notice-success"><p><?php echo esc_html($success_msg); ?></p></div>
        <?php endif; ?>

        <div style="margin-top: 20px;">
            <form action="<?php echo esc_attr(admin_url('admin.php?page=wello-servicedesk-settings')); ?>" method="post">
                <?php wp_nonce_field('wello_set_access_token_nonce', 'wello_set_access_token_nonce_field'); ?>
                <label for="access_token_display"><strong><?php echo esc_html__('Access Token:', 'wello-servicedesk-api'); ?></strong></label><br>
                <input type="text" id="access_token_display" name="access_token" value="<?php echo esc_attr($access_token); ?>" readonly style="width: 50%; margin-top: 10px;">
                <button type="submit" class="button" style="margin-top: 10px;"><?php echo esc_html__('Set Access Token', 'wello-servicedesk-api'); ?></button>
            </form>

            <!-- 🧹 Clear Access Token Button -->
            <form method="post" style="margin-top: 15px;">
                <?php wp_nonce_field('clear_access_token_nonce', 'clear_access_token_nonce_field'); ?>
                <button type="submit" name="clear_access_token" class="button button-secondary"
                    onclick="return confirm('<?php echo esc_js(__('Are you sure you want to clear the access token?', 'wello-servicedesk-api')); ?>');">
                    <?php echo esc_html__('Clear Access Token', 'wello-servicedesk-api'); ?>
                </button>
            </form>
        </div>
    <?php else: ?>
        <?php if ($success_msg): ?>
            <div class="notice notice-success"><p><?php echo esc_html($success_msg); ?></p></div>
        <?php endif; ?>

        <?php if ($error_msg): ?>
            <div class="notice notice-error"><p><?php echo esc_html($error_msg); ?></p></div>
        <?php endif; ?>

        <?php if (!$otp_token): ?>
            <form method="post">
                <?php wp_nonce_field('request_otp_nonce', 'request_otp_nonce_field'); ?>
                <p>
                    <label for="wello_username"><?php echo esc_html__('Username', 'wello-servicedesk-api'); ?></label><br>
                    <input type="text" name="wello_username" id="wello_username" required>
                </p>
                <p>
                    <label for="wello_password"><?php echo esc_html__('Password', 'wello-servicedesk-api'); ?></label><br>
                    <input type="password" name="wello_password" id="wello_password" required>
                </p>
                <button type="submit" name="request_otp" class="button button-primary"><?php echo esc_html__('Request OTP', 'wello-servicedesk-api'); ?></button>
            </form>
        <?php else: ?>
            <form method="post">
                <?php wp_nonce_field('confirm_otp_nonce', 'confirm_otp_nonce_field'); ?>
                <input type="hidden" name="otp_token" value="<?php echo esc_attr($otp_token); ?>">
                <p>
                    <label for="wello_otp_code"><?php echo esc_html__('OTP Code', 'wello-servicedesk-api'); ?></label><br>
                    <input type="text" name="wello_otp_code" id="wello_otp_code" required>
                </p>
                <button type="submit" name="confirm_otp" class="button button-primary"><?php echo esc_html__('Confirm OTP', 'wello-servicedesk-api'); ?></button>
            </form>
        <?php endif; ?>
    <?php endif; ?>
</div>
<?php
}