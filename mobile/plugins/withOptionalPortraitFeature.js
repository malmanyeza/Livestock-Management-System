const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withOptionalPortraitFeature(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest['uses-feature']) {
      manifest['uses-feature'] = [];
    }

    const featureName = 'android.hardware.screen.portrait';
    const existing = manifest['uses-feature'].find(
      (f) => f.$ && f.$['android:name'] === featureName
    );

    if (existing) {
      existing.$['android:required'] = 'false';
    } else {
      manifest['uses-feature'].push({
        $: {
          'android:name': featureName,
          'android:required': 'false',
        },
      });
    }

    return config;
  });
};
