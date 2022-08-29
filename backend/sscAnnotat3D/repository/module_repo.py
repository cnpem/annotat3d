__modules = dict()

def set_module(key, module):
    if module is not None:
        __modules[key] = module

def get_module(key):
    return __modules.get(key, None)

def delete_module(key):
    del __modules[key]


