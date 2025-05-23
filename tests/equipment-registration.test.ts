import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract calls
const mockEquipmentData = new Map();
let equipmentCounter = 1;
const mockNftOwners = new Map();

// Mock contract functions
const mockContractFunctions = {
  'register-equipment': (name, manufacturer, model, year) => {
    const equipmentId = equipmentCounter;
    const owner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Mock tx-sender
    
    mockNftOwners.set(equipmentId, owner);
    mockEquipmentData.set(equipmentId, {
      name,
      manufacturer,
      model,
      year,
      owner,
      status: 'active'
    });
    
    equipmentCounter++;
    return { type: 'ok', value: equipmentId };
  },
  
  'get-equipment': (equipmentId) => {
    if (mockEquipmentData.has(equipmentId)) {
      return { type: 'ok', value: mockEquipmentData.get(equipmentId) };
    }
    return { type: 'none' };
  },
  
  'update-equipment-status': (equipmentId, status) => {
    if (!mockEquipmentData.has(equipmentId)) {
      return { type: 'err', value: 404 };
    }
    
    const owner = mockNftOwners.get(equipmentId);
    if (owner !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
      return { type: 'err', value: 403 };
    }
    
    const equipment = mockEquipmentData.get(equipmentId);
    equipment.status = status;
    mockEquipmentData.set(equipmentId, equipment);
    
    return { type: 'ok', value: true };
  },
  
  'transfer-equipment': (equipmentId, recipient) => {
    if (!mockEquipmentData.has(equipmentId)) {
      return { type: 'err', value: 404 };
    }
    
    const owner = mockNftOwners.get(equipmentId);
    if (owner !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
      return { type: 'err', value: 403 };
    }
    
    mockNftOwners.set(equipmentId, recipient);
    const equipment = mockEquipmentData.get(equipmentId);
    equipment.owner = recipient;
    mockEquipmentData.set(equipmentId, equipment);
    
    return { type: 'ok', value: true };
  }
};

describe('Equipment Registration Contract', () => {
  beforeEach(() => {
    mockEquipmentData.clear();
    mockNftOwners.clear();
    equipmentCounter = 1;
  });
  
  it('should register new equipment', () => {
    const result = mockContractFunctions['register-equipment'](
        'CNC Machine',
        'Haas',
        'VF-2',
        2022
    );
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(1);
    
    const equipment = mockEquipmentData.get(1);
    expect(equipment).toBeDefined();
    expect(equipment.name).toBe('CNC Machine');
    expect(equipment.manufacturer).toBe('Haas');
    expect(equipment.model).toBe('VF-2');
    expect(equipment.year).toBe(2022);
    expect(equipment.status).toBe('active');
  });
  
  it('should get equipment details', () => {
    // Register equipment first
    mockContractFunctions['register-equipment'](
        'CNC Machine',
        'Haas',
        'VF-2',
        2022
    );
    
    const result = mockContractFunctions['get-equipment'](1);
    
    expect(result.type).toBe('ok');
    expect(result.value.name).toBe('CNC Machine');
    expect(result.value.manufacturer).toBe('Haas');
    expect(result.value.model).toBe('VF-2');
    expect(result.value.year).toBe(2022);
    expect(result.value.status).toBe('active');
  });
  
  it('should update equipment status', () => {
    // Register equipment first
    mockContractFunctions['register-equipment'](
        'CNC Machine',
        'Haas',
        'VF-2',
        2022
    );
    
    const result = mockContractFunctions['update-equipment-status'](1, 'maintenance');
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
    
    const equipment = mockEquipmentData.get(1);
    expect(equipment.status).toBe('maintenance');
  });
  
  it('should transfer equipment ownership', () => {
    // Register equipment first
    mockContractFunctions['register-equipment'](
        'CNC Machine',
        'Haas',
        'VF-2',
        2022
    );
    
    const newOwner = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = mockContractFunctions['transfer-equipment'](1, newOwner);
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
    
    const equipment = mockEquipmentData.get(1);
    expect(equipment.owner).toBe(newOwner);
    expect(mockNftOwners.get(1)).toBe(newOwner);
  });
  
  it('should fail to update equipment that does not exist', () => {
    const result = mockContractFunctions['update-equipment-status'](999, 'maintenance');
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(404);
  });
});
