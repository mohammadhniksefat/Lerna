"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../users/user.entity");
let AuthService = AuthService_1 = class AuthService {
    userRepository;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(userRepository, configService) {
        this.userRepository = userRepository;
        this.configService = configService;
    }
    async findByEmail(email) {
        return this.userRepository.findOne({ where: { email } });
    }
    async validateUser(email, password) {
        const user = await this.findByEmail(email);
        if (!user) {
            return null;
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return null;
        }
        return user;
    }
    async login(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = jwt.sign(payload, this.configService.get('jwt.secret'), {
            expiresIn: this.configService.get('jwt.expiresIn'),
        });
        return {
            accessToken,
            user: this.toUserDto(user),
        };
    }
    async register(dto) {
        const existing = await this.findByEmail(dto.email);
        if (existing) {
            throw new common_1.ConflictException(`User with email ${dto.email} already exists`);
        }
        const passwordHash = await bcrypt.hash(dto.password, this.configService.get('bcrypt.saltRounds'));
        const userEntity = this.userRepository.create({
            email: dto.email,
            passwordHash,
            role: user_entity_1.UserRole.STUDENT,
        });
        await this.userRepository.save(userEntity);
        const accessToken = jwt.sign({ sub: userEntity.id, email: userEntity.email, role: userEntity.role }, this.configService.get('jwt.secret'), {
            expiresIn: this.configService.get('jwt.expiresIn'),
        });
        return {
            accessToken,
            user: this.toUserDto(userEntity),
        };
    }
    async bootstrapAdmin() {
        const adminEmail = this.configService.get('admin.email');
        const adminPassword = this.configService.get('admin.password');
        if (!adminEmail || !adminPassword) {
            this.logger.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to provision the initial Admin account. Aborting startup.');
            throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to provision the initial Admin account.');
        }
        const existingAdmin = await this.userRepository.findOne({
            where: { role: user_entity_1.UserRole.ADMIN },
        });
        if (existingAdmin) {
            this.logger.log('Admin account already exists; bootstrap skipped.');
            return;
        }
        const passwordHash = await bcrypt.hash(adminPassword, this.configService.get('bcrypt.saltRounds'));
        const admin = this.userRepository.create({
            email: adminEmail,
            passwordHash,
            role: user_entity_1.UserRole.ADMIN,
        });
        await this.userRepository.save(admin);
        this.logger.log(`Admin account provisioned: ${adminEmail}`);
    }
    toUserDto(user) {
        return {
            id: user.id,
            email: user.email,
            role: user.role,
        };
    }
    async onModuleInit() {
        await this.bootstrapAdmin();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map