import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Nft, NftDocument } from '../nft/nft.schema';
import { UpdateProfileDto } from './profile.dto';
import { Profile, ProfileDocument } from './profile.schema';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(Nft.name)
    private readonly nftModel: Model<NftDocument>,
  ) {}

  async findAll(): Promise<Profile[]> {
    return await this.profileModel.find().lean().exec();
  }
  async findAllArtist(): Promise<Profile[]> {
    return await this.profileModel.find({ artist: true }).lean().exec();
  }
  async getProfile(wallet: string): Promise<Profile> {
    return await this.profileModel.findOne({ wallet }).lean().exec();
  }

  async updateProfile(wallet: string, updateProfileDto: UpdateProfileDto) {
    await this.profileModel
      .findOneAndUpdate({ wallet }, updateProfileDto, { upsert: true })
      .exec();
  }

  async toggleFriend(wallet: string, friend: string) {
    const profile = await this.profileModel.findOne({ wallet }).exec();
    const indexOf = profile.friends.indexOf(friend);
    if (indexOf >= 0) profile.friends.splice(indexOf, 1);
    else profile.friends.push(friend);
    await profile.save();
    return profile;
  }

  async toggleVerified(wallet: string) {
    const profile = await this.profileModel.findOne({ wallet }).exec();
    profile.verified = !profile.verified;
    await this.nftModel
      .updateMany({ artist: profile.wallet }, { curated: profile.verified })
      .exec();
    await profile.save();
  }

  async itemSale(wallet: string, amount: number) {
    const profile = await this.profileModel.findOne({ wallet }).exec();
    profile.totalVolume += amount;
    await profile.save();
  }
}
/*
      verifySignature(
        updateAvatarLinkDto.payloadBytes,
        updateAvatarLinkDto.publicKey,
        updateAvatarLinkDto.signature,
      ) === false
*/
