# SPDX-License-Identifier: MIT
# Copyright (c) 2026 RICHARDwuxiaofei
"""Regression checks: material/assembly metadata must agree with actual objects."""
import unittest,zipfile,tempfile,json
from pathlib import Path
from validate_3mf import validate
ROOT=Path(__file__).resolve().parents[2]
FIXTURE=ROOT/'studio/evidence/classic-large-avatar-2026-11-03/classic-default.3mf'
class PackageTests(unittest.TestCase):
 def check_mutation(self,fn):
  with zipfile.ZipFile(FIXTURE)as z:files={n:z.read(n)for n in z.namelist()}
  fn(files)
  with tempfile.TemporaryDirectory()as folder:
   p=Path(folder)/'invalid.3mf'
   with zipfile.ZipFile(p,'w')as z:
    for n,v in files.items():z.writestr(n,v)
   with self.assertRaises((AssertionError,ValueError)):validate(p)
 def mutate_plan(self,fn):
  def change(files):
   plan=json.loads(files['Metadata/printing.json']);fn(plan);files['Metadata/printing.json']=json.dumps(plan).encode()
  self.check_mutation(change)
 def test_valid(self):self.assertEqual(validate(FIXTURE)['status'],'PASS')
 def test_wrong_slot(self):self.mutate_plan(lambda p:p['parts'][0].update(slot=0))
 def test_wrong_color(self):self.mutate_plan(lambda p:p['parts'][0].update(color='#123456'))
 def test_wrong_palette(self):self.mutate_plan(lambda p:p['palette'].__setitem__(0,'#123456'))
 def test_missing_part(self):self.mutate_plan(lambda p:p['parts'].pop())
 def test_repeated_assembly_mesh(self):
  def change(files):
   s=files['3D/3dmodel.model'].decode().replace('</components>','<component objectid="2"/></components>');files['3D/3dmodel.model']=s.encode()
  self.check_mutation(change)
if __name__=='__main__':unittest.main()
