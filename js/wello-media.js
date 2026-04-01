jQuery(document).ready(function($) {
    let mediaUploader;

    $('.upload-media').on('click', function(e) {
        e.preventDefault();
        const targetField = $(this).data('target');

        // Reuse existing uploader if available
        if (mediaUploader) {
            mediaUploader.open();
            return;
        }

        mediaUploader = wp.media({
            title: 'Select Image',
            button: { text: 'Use this image' },
            multiple: false
        });

        mediaUploader.on('select', function() {
            const attachment = mediaUploader.state().get('selection').first().toJSON();
            $('#' + targetField).val(attachment.url);
        });

        mediaUploader.open();
    });
});