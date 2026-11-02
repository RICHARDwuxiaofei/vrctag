import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from mesh_validation import validate_mesh
from validate_3mf import validate

def tetra(size,origin=(0,0,0),reverse=False):
 vs=[tuple(v[k]+origin[k]for k in range(3))for v in[(0,0,0),(size,0,0),(0,size,0),(0,0,size)]];ts=[(0,2,1),(0,1,3),(0,3,2),(1,2,3)]
 return vs,[tuple(reversed(t))for t in ts]if reverse else ts

def combine(*parts):
 vs=[];ts=[]
 for a,b in parts:n=len(vs);vs+=a;ts += [tuple(i+n for i in t)for t in b]
 return vs,ts

class MeshRegression(unittest.TestCase):
 def test_isolated_reverse(self):self.assertFalse(validate_mesh(*combine(tetra(2),tetra(1,(5,0,0),True)))['valid'])
 def test_cavity(self):self.assertTrue(validate_mesh(*combine(tetra(6),tetra(2,(1,1,1),True)))['valid'])
 def test_wrong_nested_orientation(self):self.assertFalse(validate_mesh(*combine(tetra(6),tetra(2,(1,1,1))))['valid'])
 def test_nested_island(self):self.assertTrue(validate_mesh(*combine(tetra(8),tetra(3,(1,1,1),True),tetra(.2,(1.4,1.4,1.4))))['valid'])
 def test_intersection(self):self.assertFalse(validate_mesh(*combine(tetra(2),tetra(2,(.3,.3,.3))))['valid'])
 def test_old_exploit_package(self):
  with self.assertRaises(ValueError):validate(Path(__file__).resolve().parents[1]/'evidence/review-2026-11-02/synthetic-inward-shell.3mf')
if __name__=='__main__':unittest.main()
