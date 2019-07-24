# Copyright (c) Jeremy Tuloup.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""
import asyncio
import time

import psutil

from ipywidgets import DOMWidget
from traitlets import Int, Float, List, Unicode
from ._frontend import module_name, module_version


# inspired by https://stackoverflow.com/a/1094933
def sizeof_fmt(num, suffix='B'):
    for unit in ['','K','M','G','T','P','E','Z']:
        if abs(num) < 1024.0:
            return "%3.1f %s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f%s%s" % (num, 'Y', suffix)


class KernelMemoryUsage(DOMWidget):
    _model_name = Unicode('KernelMemoryUsageModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('KernelMemoryUsageView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    NB_VALUES = 20
    refresh_rate = Int(1)  # in seconds
    _current = Int(0).tag(sync=True)
    _text = Unicode("0 / 0 B").tag(sync=True)
    _values = List([0] * 20).tag(sync=True)
    _percentage = Float(None, allow_none=True).tag(sync=True)
    limit = Int(None, allow_none=True).tag(sync=True)
    label = Unicode("Mem:").tag(sync=True)


    def __init__(self, *args, **kwargs):
        super(KernelMemoryUsage, self).__init__(*args, **kwargs)
        self._refresh_task = asyncio.create_task(self._refresh_current_rss())

    def __del__(self):
        self._refresh_task.cancel()
        super(KernelMemoryUsage, self).__del__()

    def _get_current_rss(self):
        # TODO: move to generic module / nbresuse?
        cur_process = psutil.Process()
        all_processes = [cur_process] + cur_process.children(recursive=True)
        rss = sum([p.memory_info().rss for p in all_processes])
        return rss

    async def _refresh_current_rss(self):
        while True:
            self._current = self._get_current_rss()
            self._percentage = self._current / self.limit if self.limit is not None else None
            self._values.append(self._percentage)
            self._values = self._values[-self.NB_VALUES:]

            suffix = f"/ {sizeof_fmt(self.limit)}" if self.limit else ""
            self._text = f"{sizeof_fmt(self._current)} {suffix}"
            self.send_state()
            await asyncio.sleep(self.refresh_rate)
