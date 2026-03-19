from yt_dude.extractor.generic import GenericIE


class _UnderscoreOverrideGenericIE(GenericIE, plugin_name='underscore-override'):
    SECONDARY_TEST_FIELD = 'underscore-override'
