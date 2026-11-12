#!/usr/bin/env python3
"""Write a COFF .syso holding a Windows icon, a manifest and version info, for the Go linker.

usage: mkrsrc.py icon.ico out.syso "File description" 4.6.0.0 [Product name]
"""
import struct, sys

ico_path, out_path, desc, ver = sys.argv[1:5]
product = sys.argv[5] if len(sys.argv) > 5 else 'Fishamongus!'

MANIFEST = b'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity type="win32" name="krazow.Fishamongus" version="1.0.0.0" processorArchitecture="amd64"/>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security><requestedPrivileges><requestedExecutionLevel level="asInvoker" uiAccess="false"/></requestedPrivileges></security>
  </trustInfo>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application><supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}"/></application>
  </compatibility>
  <application xmlns="urn:schemas-microsoft-com:asm.v3">
    <windowsSettings>
      <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true/pm</dpiAware>
      <dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2</dpiAwareness>
    </windowsSettings>
  </application>
  <dependency><dependentAssembly>
    <assemblyIdentity type="win32" name="Microsoft.Windows.Common-Controls" version="6.0.0.0" processorArchitecture="*" publicKeyToken="6595b64144ccf1df" language="*"/>
  </dependentAssembly></dependency>
</assembly>
'''

# ---- icon ----
ico = open(ico_path, 'rb').read()
_, typ, n = struct.unpack_from('<HHH', ico, 0)
assert typ == 1
icons, group = [], struct.pack('<HHH', 0, 1, n)
for i in range(n):
    w, h, cc, r, planes, bpp, size, off = struct.unpack_from('<BBBBHHII', ico, 6 + 16 * i)
    icons.append(ico[off:off + size])
    group += struct.pack('<BBBBHHIH', w, h, cc, r, planes, bpp, size, i + 1)

# ---- version info ----
def vs_block(key, value=b'', children=b'', vtype=1, vlen=None):
    k = (key + '\0').encode('utf-16le')
    hdr_len = 6 + len(k)
    pad1 = b'\0' * ((4 - hdr_len % 4) % 4)
    body = value
    if value and len(body) % 4: body += b'\0' * (4 - len(body) % 4)
    blk = k + pad1 + body + children
    if vlen is None: vlen = len(value) // 2 if vtype == 1 else len(value)
    total = 6 + len(blk)
    return struct.pack('<HHH', total, vlen, vtype) + blk

def vs_str(key, val):
    v = (val + '\0').encode('utf-16le')
    b = vs_block(key, v, vtype=1, vlen=len(val) + 1)
    return b + b'\0' * ((4 - len(b) % 4) % 4)

parts = [int(x) for x in ver.split('.')]
ms, ls = (parts[0] << 16) | parts[1], (parts[2] << 16) | parts[3]
fixed = struct.pack('<13I', 0xFEEF04BD, 0x00010000, ms, ls, ms, ls, 0x3F, 0, 0x40004, 1, 0, 0, 0)
strings = b''.join(vs_str(k, v) for k, v in [
    ('CompanyName', 'krazow'), ('FileDescription', desc), ('FileVersion', ver),
    ('LegalCopyright', 'krazow'), ('ProductName', product), ('ProductVersion', ver)])
st = vs_block('040904B0', children=strings, vtype=1, vlen=0)
sfi = vs_block('StringFileInfo', children=st, vtype=1, vlen=0)
var = vs_block('Translation', struct.pack('<HH', 0x0409, 0x04B0), vtype=0, vlen=4)
vfi = vs_block('VarFileInfo', children=var, vtype=1, vlen=0)
version = vs_block('VS_VERSION_INFO', fixed, children=sfi + vfi, vtype=0, vlen=len(fixed))

# ---- resource tree ----  type -> [(id, data)]
res = {3: [(i + 1, d) for i, d in enumerate(icons)], 14: [(1, group)], 16: [(1, version)], 24: [(1, MANIFEST)]}
LANG = 0x0409

def align(b, a=8):
    return b + b'\0' * ((a - len(b) % a) % a)

# layout: root dir, type dirs, name dirs (one lang each), data entries, then data
types = sorted(res)
n_names = sum(len(res[t]) for t in types)
root_size = 16 + 8 * len(types)
type_dir_off, off = {}, root_size
for t in types:
    type_dir_off[t] = off; off += 16 + 8 * len(res[t])
name_dir_off = {}
for t in types:
    for nid, _ in res[t]:
        name_dir_off[(t, nid)] = off; off += 16 + 8
entry_off = {}
for t in types:
    for nid, _ in res[t]:
        entry_off[(t, nid)] = off; off += 16
data_off = {}
for t in types:
    for nid, d in res[t]:
        off = (off + 7) & ~7
        data_off[(t, nid)] = off; off += len(d)

def dirhdr(nid):
    return struct.pack('<IIHHHH', 0, 0, 0, 0, 0, nid)

buf = bytearray(dirhdr(len(types)))
for t in types:
    buf += struct.pack('<II', t, 0x80000000 | type_dir_off[t])
for t in types:
    buf += dirhdr(len(res[t]))
    for nid, _ in res[t]:
        buf += struct.pack('<II', nid, 0x80000000 | name_dir_off[(t, nid)])
for t in types:
    for nid, _ in res[t]:
        buf += dirhdr(1) + struct.pack('<II', LANG, entry_off[(t, nid)])
relocs = []
for t in types:
    for nid, d in res[t]:
        relocs.append(len(buf))
        buf += struct.pack('<IIII', data_off[(t, nid)], len(d), 0, 0)
for t in types:
    for nid, d in res[t]:
        while len(buf) < data_off[(t, nid)]: buf += b'\0'
        buf += d
buf = align(bytes(buf))

# ---- COFF ----
HDR, SEC = 20, 40
raw_ptr = HDR + SEC
rel_ptr = raw_ptr + len(buf)
sym_ptr = rel_ptr + 10 * len(relocs)
coff = struct.pack('<HHIIIHH', 0x8664, 1, 0, sym_ptr, 1, 0, 0)
coff += struct.pack('<8sIIIIIIHHI', b'.rsrc', 0, 0, len(buf), raw_ptr, rel_ptr, 0, len(relocs), 0, 0x40000040)
coff += buf
for r in relocs:
    coff += struct.pack('<IIH', r, 0, 3)  # IMAGE_REL_AMD64_ADDR32NB against symbol 0 (.rsrc)
coff += struct.pack('<8sIhHBB', b'.rsrc', 0, 1, 0, 3, 0)
coff += struct.pack('<I', 4)
open(out_path, 'wb').write(coff)
print(out_path, len(coff), 'bytes,', len(icons), 'icon sizes')
