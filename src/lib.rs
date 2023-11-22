use wasm_bindgen::prelude::*;
mod utils;
use crate::utils::set_panic_hook;

#[wasm_bindgen]
pub struct VirtualMachine {
    rom: [u16; 65536],
    mem: [u16; 256],
    code: Vec<u16>,
    pub instruction_pointer: u16,
    last_instruction: String,
    pub mempointer: u8,
    pub register_a: u16,
    pub register_b: u16,
    pub romsegment: u16,
}

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
impl VirtualMachine {
    pub fn new(code: Vec<u16>) -> VirtualMachine {
        log(&format!("{:?}", code));
        VirtualMachine {
            rom: [0; 65536],
            mem: [0; 256],
            code,
            instruction_pointer: 0,
            mempointer: 0,
            register_a: 0,
            register_b: 0,
            last_instruction: "".to_string(),
            romsegment: 0,
        }
    }
    pub fn get_last_instruction(&mut self) -> String {
        self.last_instruction.clone()
    }
    pub fn setup(&mut self) {
        // Copy code into rom
        self.rom[..self.code.len()].copy_from_slice(&self.code);
    }
    pub fn get_memory(&mut self) -> Vec<i32> {
        let memtoexport: Vec<i32> = self.mem.iter().map(|&x| x as i32).collect();
        memtoexport
    }
    pub fn set_byte(&mut self, address: u8, data: u16) {
        self.mem[address as usize] = data;
    }
    pub fn step(&mut self) -> char {
        let instruction: u16 = self.rom[self.instruction_pointer as usize];
        let next: u16 = if self.instruction_pointer != 65535 { // Only set next if there is a next 
            self.rom[(self.instruction_pointer + 1) as usize]
        } else { // If there's not, just set it to 0xFFFF (next instruction = halt)
            u16::MAX
        };
        self.last_instruction = format!("{:#X}", instruction);
        set_panic_hook(); // Set panic hook for better error messages
        match instruction {
            0x11 => {
                // Copy an 16 bit address range (ie 0x00 to 0xFF would be 0x00FF) to memory
                let mut add1 = ((next >> 8) + (self.romsegment * 256) - 1) as usize;
                let mut add2 = ((next & 0xFF) + (self.romsegment * 256) - 1) as usize;
                if self.romsegment == 0 {
                    (add1, add2) = (add1 + 1, add2 + 1)
                }
                self.mem[((next >> 8) as usize)..((next & 0xFF) as usize)]
                    .copy_from_slice(&self.rom[add1..add2]);
                self.last_instruction = format!("{:#X} {:#X}", instruction, next);
                self.instruction_pointer += 1;
            }
            0x0A => {
                // Set register A to a 16 bit value
                self.register_a = next;
                self.last_instruction = format!("{:#X} {:#X}", instruction, next);
                self.instruction_pointer += 1;
            }
            0x06 => {
                // Swap Register A and B
                (self.register_b, self.register_a) = (self.register_a, self.register_b);
            }
            0x09 => {
                // Add register a and b
                self.register_a = self.register_a + self.register_b;
            }
            0x012 => {
                // Set memory pointer to register a
                self.mempointer = (self.register_a & 0xFF) as u8;
            }
            0x14 => {
                self.mem[self.mempointer as usize] = self.register_a;
            }
            0x15 => {
                // Set rom segment between 0 and
                self.romsegment = next & 0xFF;
                if self.romsegment <= u8::MAX.into() {
                    self.last_instruction = format!("{:#X} {:#X}", instruction, next);
                    self.instruction_pointer += 1;
                } else {
                    return '�';
                }
            }
            0x08 => {
                // Set register a to value in memory
                self.register_a = self.mem[self.mempointer as usize];
            }
            0x03 => {
                // Jump if not 0
                self.last_instruction = format!("{:#X} {:#X}", instruction, next);
                if self.register_a != 0 {
                    self.instruction_pointer = next - 1;
                } else {
                    self.instruction_pointer += 1;
                }
            }
            0x01 => {
                // Output register a
                self.instruction_pointer += 1;
                return ((self.register_a & 0xFF) as u8) as char;
            }
            0x13 => {
                // Jump
                self.instruction_pointer = next;
                self.last_instruction = format!("{:#X} {:#X}", instruction, next);
                return '→';
            }
            0xFFFF => {
                // Halt
                return '�';
            }
            _ => {}
        }
        if self.instruction_pointer != 65535 {
            self.instruction_pointer += 1;
            return '→';
        } else {
            return '�';
        }
    }
}
